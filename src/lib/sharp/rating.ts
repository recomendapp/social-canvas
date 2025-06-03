import sharp from "sharp";
import { createRoundedCornerSVG } from "./roundCorners";

const createRating = async ({
	rating,
	color = '#000000',
	backgroundColor = '#FFFFFF',
	width = 200,
	height = 100,
	padding = 10,
	borderRadius = 10,
	borderWidth = 4,
}: {
	rating: number;
	color?: string;
	backgroundColor?: string;
	width?: number;
	height?: number;
	padding?: number;
	borderRadius?: number;
	borderWidth?: number;
}) => {
	const text = await sharp({
		text: {
			text: `<span foreground="${color}">${rating >= 10 ? rating : rating.toFixed(1)}</span>`,
			font: 'Arial Black',
			width,
			height,
			align: 'center',
			rgba: true,
		},
	})
	.png()
	.toBuffer();
	const textMeta = await sharp(text).metadata();

	const boxWidth = width + 2 * padding;
	const boxHeight = height + 2 * padding;

	const outerSvg = createRoundedCornerSVG(boxWidth, boxHeight, borderRadius, color);
	const innerRadius = typeof borderRadius === 'number'
	? Math.max(borderRadius - borderWidth, 0)
	: Object.fromEntries(
		Object.entries(borderRadius as Record<string, number>).map(
		([k, v]) => [k, Math.max((v || 0) - borderWidth, 0)]
		)
	);
	const innerSvg = createRoundedCornerSVG(boxWidth - 2 * borderWidth, boxHeight - 2 * borderWidth, innerRadius, backgroundColor);

	return await sharp({
		create: {
			width: boxWidth,
			height: boxHeight,
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		},
	})
	.composite([
		{ input: Buffer.from(outerSvg), top: 0, left: 0 },
		{ input: Buffer.from(innerSvg), top: borderWidth, left: borderWidth },
		{
			input: text,
			top: Math.floor((boxHeight - (textMeta.height || 0)) / 2),
			left: Math.floor((boxWidth - (textMeta.width || 0)) / 2),
		},
	])
	.png()
	.toBuffer();
};

export default createRating;