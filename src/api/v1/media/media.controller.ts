import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import Controller from '../../../interfaces/controller.interface';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { createRoundedCornerSVG } from '../../../lib/sharp/roundCorners';
import { createColorOverlaySVG } from '../../../lib/sharp/colorOverlay';
import { redis } from '../../../lib/redis';
import RECOMEND_CONSTANTS from '../../../constants/recomend';

class MediaCardController implements Controller {
	register(app: FastifyInstance, prefix = ''): void {
		const basePath = `${prefix}/media`;
		app.get(`${basePath}/card`, {
			schema: {
				querystring: {
					type: 'object',
					properties: {
						title: { type: 'string', description: 'Media Title' },
						credits: { type: 'string', description: 'Media Credits' },
						poster: { type: 'string', description: 'Media Poster URL' },
						background: { type: 'string', description: 'Background Image URL' },
					},
					required: ['title', 'poster'],
				}
			}
		}, this.card.bind(this));
	}

	async card(req: FastifyRequest, reply: FastifyReply): Promise<void> {
		const { title, credits, poster: posterUrl, background: backgroundUrl } = req.query as {
			title: string;
			credits?: string;
			poster: string;
			background?: string;
		};
		const cacheKey = `media-card:title=${title}&poster=${posterUrl}&credits=${credits || ''}&background=${backgroundUrl || ''}`;
		const cacheDuration = 60 * 60 * 24; // 24 hours
		const cached = await redis.get(cacheKey);
		if (cached) {
			return reply.type('image/png').send(Buffer.from(cached, 'base64'));
		}
		/* -------------------------------- CONSTANTS ------------------------------- */
		const baseWidth = 1206;
		const baseHeight = 2144;
		const format = 2 / 3;
		const padding = 50;
		const POSTER_CONSTANTS = {
			width: 600,
			height: Math.floor(600 / format),
			offsetY: -200,
			roundedCorners: 20,
		};
		const TITLE_CONSTANTS = {
			maxWidth: baseWidth - (2 * padding),
			maxHeight: 60,
			color: 'white',
			gapFromPoster: 50,
			font: 'Arial Black',
		}
		const CREDITS_CONSTANTS = {
			maxWidth: baseWidth - (2 * padding),
			maxHeight: 30,
			color: 'white',
			gapFromTitle: 30,
			font: 'Arial',
		}
		const APP_LOGO_CONSTANTS = {
			width: 300,
		}
		/* -------------------------------------------------------------------------- */
		const layers: sharp.OverlayOptions[] = [];
		const image = sharp({
			create: {
				width: baseWidth,
				height: baseHeight,
				channels: 4,
				background: { r: 255, g: 255, b: 255, alpha: 0 }
			}
		})

		/* -------------------------------------------------------------------------- */
		/*                                   LAYERS                                   */
		/* -------------------------------------------------------------------------- */
		
		/* --------------------------------- Poster --------------------------------- */
		const posterRes = await fetch(posterUrl);
		if (!posterRes.ok) {
			return reply.status(400).send({ error: 'Invalid poster URL' });
		}
		const posterLayer = await sharp(await posterRes.arrayBuffer())
			.resize({
				width: POSTER_CONSTANTS.width,
				height: POSTER_CONSTANTS.height,
				fit: 'cover',
				position: 'center',
			})
			.composite([{
				input: createRoundedCornerSVG(POSTER_CONSTANTS.width, POSTER_CONSTANTS.height, POSTER_CONSTANTS.roundedCorners),
				blend: 'dest-in',
			}])
			.png()
			.toBuffer();
		const posterMeta = await sharp(posterLayer).metadata();
		/* -------------------------------------------------------------------------- */
		
		/* ---------------------------------- Title --------------------------------- */
		const titleLayer = await sharp({
			text: {
				text: `<span foreground="${TITLE_CONSTANTS.color}">${title}</span>`,
				font: TITLE_CONSTANTS.font,
				width: TITLE_CONSTANTS.maxWidth,
				height: TITLE_CONSTANTS.maxHeight,
				align: 'center',
				rgba: true,
			}
		})
		.png()
		.toBuffer();
		const titleMeta = await sharp(titleLayer).metadata();
		/* -------------------------------------------------------------------------- */
		
		/* --------------------------------- Credits -------------------------------- */
		let creditsLayer: Buffer | undefined;
		let creditsMeta: sharp.Metadata | undefined;
		if (credits) {
			creditsLayer = await sharp({
				text: {
					text: `<span foreground="${CREDITS_CONSTANTS.color}">${credits}</span>`,
					font: CREDITS_CONSTANTS.font,
					fontfile: undefined,
					width: CREDITS_CONSTANTS.maxWidth,
					height: CREDITS_CONSTANTS.maxHeight,
					align: 'center',
					rgba: true,
				},
			})
			.png()
			.toBuffer();
			creditsMeta = await sharp(creditsLayer).metadata();
		}
		/* -------------------------------------------------------------------------- */

		/* ---------------------------------- GROUP --------------------------------- */
		let groupHeight = POSTER_CONSTANTS.height + TITLE_CONSTANTS.gapFromPoster + (titleMeta.height || 200);
		if (creditsMeta) {
			groupHeight += CREDITS_CONSTANTS.gapFromTitle + (creditsMeta.height || 100);
		}
		const groupWidth = Math.max(POSTER_CONSTANTS.width, titleMeta.width || 0, creditsMeta?.width || 0) + (2 * padding);
		const groupLayers: sharp.OverlayOptions[] = [];
		const groupImage = sharp({
			create: {
				width: groupWidth,
				height: groupHeight,
				channels: 4,
				background: { r: 0, g: 0, b: 0, alpha: 0 },
			},
		});
		groupLayers.push({
			input: posterLayer,
			left: Math.floor((groupWidth - (posterMeta.width || 0)) / 2),
			top: 0,
		});
		groupLayers.push({
			input: titleLayer,
			left: Math.floor((groupWidth - (titleMeta.width || 0)) / 2),
			top: POSTER_CONSTANTS.height + TITLE_CONSTANTS.gapFromPoster,
		});
		if (creditsLayer && creditsMeta) {
			groupLayers.push({
				input: creditsLayer,
				left: Math.floor((groupWidth - (creditsMeta.width || 0)) / 2),
				top: POSTER_CONSTANTS.height + TITLE_CONSTANTS.gapFromPoster + (titleMeta.height || 200) + CREDITS_CONSTANTS.gapFromTitle,
			});
		}
		const groupBuffer = await groupImage.composite(groupLayers).png().toBuffer();
		const groupMeta = await sharp(groupBuffer).metadata();
		layers.push({
			input: groupBuffer,
			top: Math.floor((baseHeight - (groupMeta.height || 0)) / 2),
			left: Math.floor((baseWidth - (groupMeta.width || 0)) / 2),
		});
		/* -------------------------------------------------------------------------- */
		
		// Background
		if (backgroundUrl) {
			const backgroundRes = await fetch(backgroundUrl);
			if (backgroundRes.ok) { // Only add background if the fetch is successful
				const backgroundLayer = await sharp(await backgroundRes.arrayBuffer())
				.resize({
					width: baseWidth,
					height: baseHeight,
					fit: 'cover',
					position: 'center',
				})
				.composite([{
					input: createColorOverlaySVG(baseWidth, baseHeight, 0.6),
					blend: 'dest-in',
				}])
				.toBuffer();
				layers.unshift({
					input: backgroundLayer,
					top: 0,
					left: 0,
				});
			}
		}
		/* -------------------------------------------------------------------------- */
		
		/* -------------------------------- App Logo -------------------------------- */
		const logoPath = path.resolve(RECOMEND_CONSTANTS.logo.src);
		const logoBuffer = fs.readFileSync(logoPath);
		const logoPngBuffer = await sharp(logoBuffer)
			.resize({ width: APP_LOGO_CONSTANTS.width })
			.png()
			.toBuffer();
		const logoMeta = await sharp(logoPngBuffer).metadata();
		layers.push({
			input: logoPngBuffer,
			top: baseHeight - (logoMeta.height || 0) - padding,
			left: Math.floor((baseWidth - (logoMeta.width || 0)) / 2),
		});
		/* -------------------------------------------------------------------------- */

		const imageBuffer = await image
			.composite(layers)
			.png()
			.toBuffer();
	
		await redis.set(cacheKey, imageBuffer.toString('base64'), 'EX', cacheDuration);
		reply.type('image/png').send(imageBuffer);
	}
}

export default MediaCardController;