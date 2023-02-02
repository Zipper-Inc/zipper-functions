import { CSSProperties } from 'react';

type Props = {
  className?: string;
  fill?: string;
  style?: CSSProperties;
};

export const ZipperLogo: React.FC<Props> = ({
  fill = '#231f20',
  className,
  style,
} = {}) => (
  <svg
    viewBox="0.095 0.082 267.475 40"
    height="26"
    className={className}
    style={style}
    fill={fill}
  >
    <g id="g10" transform="matrix(0.2, 0, 0, -0.2, -59.405014, 128.082016)">
      <path
        d="m 1485,490 h -62.5 v -50 h 62.5 z m 137.5,75 h -200 v -50 h 133.431 c 50.484,0 66.569,28.618 66.569,50 m -66.569,75 H 1422.5 v -50 h 200 c 0,21.382 -16.085,50 -66.569,50 m 19.355,-150 59.588,-50 h -77.786 L 1497.5,490 Z M 1035,490 h -62.5 v -50 h 62.5 z m 137.5,75 h -200 v -50 h 133.431 c 50.484,0 66.569,28.618 66.569,50 m 0,25 h -200 v 50 h 133.431 c 50.484,0 66.569,-28.618 66.569,-50 m -225,-25 h -200 v -50 h 133.431 c 50.484,0 66.569,28.618 66.569,50 m -66.569,75 H 747.5 v -50 h 200 c 0,21.382 -16.085,50 -66.569,50 M 747.5,490 H 810 v -50 h -62.5 z m 650,0 h -200 v -50 h 200 z m 0,75 h -200 v -50 h 200 z m 0,25 h -200 v 50 h 200 z m -675,-100 h -200 v -50 h 200 z m -68.75,75 h -62.5 v -50 h 62.5 z m 68.75,25 h -200 v 50 h 200 z m -225,-100 h -200 v -50 h 200 z m -90.901,25 59.588,50 h -77.786 l -59.588,-50 z m 90.901,75 h -200 v 50 h 200 z"
        id="path20"
      />
    </g>
  </svg>
);
