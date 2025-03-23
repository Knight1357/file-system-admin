import { NavLink } from "react-router";

import { useTheme } from "@/theme/hooks";

// import { Iconify } from "../icon";

interface Props {
	size?: number | string;
}
function Logo({ size = 50 }: Props) {
	const { themeTokens } = useTheme();

	return (
		<NavLink to="/">
			<img
				src="src\assets\images\logo.svg" // 替换为你的 SVG 文件路径
				alt="Logo"
				style={{ width: size, height: size, color: themeTokens.color.palette.primary.default }}
			/>
		</NavLink>
	);
}

export default Logo;
