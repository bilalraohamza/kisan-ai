import React from 'react';
import { useWindowDimensions } from 'react-native';
import Svg, { Defs, Pattern, Rect, Polygon, Circle } from 'react-native-svg';

export default function AjrakBand({ h = 12 }) {
  const { width } = useWindowDimensions();
  const uid = `ajrak_${h}`;

  return (
    <Svg width={width} height={h}>
      <Defs>
        <Pattern
          id={uid}
          x="0" y="0"
          width="20" height={h}
          patternUnits="userSpaceOnUse"
        >
          <Rect width="20" height={h} fill="#7A1B2B" />
          <Polygon
            points={`10,2 18,${h / 2} 10,${h - 2} 2,${h / 2}`}
            fill="none"
            stroke="#C98B35"
            strokeWidth="1"
          />
          <Circle cx="10" cy={h / 2} r="1.8" fill="#C98B35" />
          <Rect x="0" y={h / 2 - 0.5} width="2" height="1" fill="#C98B35" />
          <Rect x="18" y={h / 2 - 0.5} width="2" height="1" fill="#C98B35" />
          <Circle cx="0"  cy="0" r="1.4" fill="#C98B35" />
          <Circle cx="20" cy="0" r="1.4" fill="#C98B35" />
          <Circle cx="0"  cy={h} r="1.4" fill="#C98B35" />
          <Circle cx="20" cy={h} r="1.4" fill="#C98B35" />
        </Pattern>
      </Defs>
      <Rect width={width} height={h} fill={`url(#${uid})`} />
    </Svg>
  );
}
