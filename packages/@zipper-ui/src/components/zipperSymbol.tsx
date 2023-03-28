interface PathProps {
  fill?: string;
  className?: string;
  style?: React.CSSProperties;
}

interface Props extends PathProps {
  top?: PathProps;
  middle?: PathProps;
  bottom?: PathProps;
  height?: number;
}

export const ZipperSymbol: React.FC<Props> = ({
  fill,
  className,
  style,
  top,
  middle,
  bottom,
  height,
} = {}) => (
  <svg
    fill={fill}
    className={className}
    style={style}
    width={40}
    height={height || 40}
    viewBox="0 0 834 834"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Top of Z */}
    <path d="M0 104.5V209h834V0H0v104.5z" {...top} />

    {/* Middle of Z */}
    <path
      d="M254.3 416.3C186 473.6 130.1 520.8 130.1 521.2c-.1.5 73 .8 162.4.8h162.4l121.8-102.1c67-56.2 123.1-103.4 124.8-105l3-2.9-163 .1h-163L254.3 416.3z"
      {...middle}
    />

    {/* Bottom of Z */}
    <path d="M0 729.5V834h834V625H0v104.5z" {...bottom} />
  </svg>
);
