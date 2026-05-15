import React from 'react';
import Svg, {Path, Circle, Rect, Line, Polyline} from 'react-native-svg';

type IconName =
  | 'user'
  | 'bell'
  | 'battery'
  | 'upload'
  | 'download'
  | 'trash'
  | 'edit'
  | 'warning'
  | 'close'
  | 'chevron-left'
  | 'chevron-right'
  | 'plus'
  | 'undo'
  | 'inbox'
  | 'list'
  | 'food'
  | 'cafe'
  | 'transport'
  | 'shopping'
  | 'subscription'
  | 'transfer'
  | 'salary'
  | 'entertainment'
  | 'health'
  | 'education'
  | 'bills'
  | 'other';

interface AppIconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export default function AppIcon({name, size = 20, color = '#888', strokeWidth = 2}: AppIconProps) {
  const s = size;
  const sw = strokeWidth;
  switch (name) {
    case 'user':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={sw} />
          <Path d="M4 20c1.8-3 4.5-4.5 8-4.5S18.2 17 20 20" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'bell':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M15 18H9m9-1H6l1.2-1.3A2 2 0 0 0 7.8 14V11a4.2 4.2 0 1 1 8.4 0v3c0 .52.2 1.01.56 1.38L18 17ZM13.73 18a2 2 0 0 1-3.46 0" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'battery':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x="2" y="7" width="18" height="10" rx="2" stroke={color} strokeWidth={sw} />
          <Rect x="4.5" y="9.5" width="8" height="5" rx="1" fill={color} />
          <Rect x="20.5" y="10" width="1.8" height="4" rx="0.6" fill={color} />
        </Svg>
      );
    case 'upload':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M12 15V4m0 0-4 4m4-4 4 4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'download':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M12 4v11m0 0-4-4m4 4 4-4" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'trash':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M4 7h16M9 7V5h6v2m-8 0 1 12h8l1-12" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <Line x1="10" y1="11" x2="10" y2="17" stroke={color} strokeWidth={sw} />
          <Line x1="14" y1="11" x2="14" y2="17" stroke={color} strokeWidth={sw} />
        </Svg>
      );
    case 'edit':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M4 20h4l10-10-4-4L4 16v4Z" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
          <Path d="m12.5 7.5 4 4" stroke={color} strokeWidth={sw} />
        </Svg>
      );
    case 'warning':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M12 4 3 20h18L12 4Z" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
          <Line x1="12" y1="9" x2="12" y2="14" stroke={color} strokeWidth={sw} />
          <Circle cx="12" cy="17" r="1" fill={color} />
        </Svg>
      );
    case 'close':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth={sw} />
          <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth={sw} />
        </Svg>
      );
    case 'chevron-left':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Polyline points="15 6 9 12 15 18" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'chevron-right':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Polyline points="9 6 15 12 9 18" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'plus':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth={sw} />
          <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth={sw} />
        </Svg>
      );
    case 'undo':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 8H4v5M4 8l3.8-3.5A9 9 0 1 1 7 18.5"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'inbox':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M4 5h16v12H15l-2 2h-2l-2-2H4V5Z" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
        </Svg>
      );
    case 'list':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Line x1="8" y1="7" x2="20" y2="7" stroke={color} strokeWidth={sw} />
          <Line x1="8" y1="12" x2="20" y2="12" stroke={color} strokeWidth={sw} />
          <Line x1="8" y1="17" x2="20" y2="17" stroke={color} strokeWidth={sw} />
          <Circle cx="4" cy="7" r="1.2" fill={color} />
          <Circle cx="4" cy="12" r="1.2" fill={color} />
          <Circle cx="4" cy="17" r="1.2" fill={color} />
        </Svg>
      );
    case 'food':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M7 4v8m3-8v8m-1.5 0V20M15 4v7a2 2 0 0 0 2 2h0V20" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'cafe':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M4 9h11v4a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9Z" stroke={color} strokeWidth={sw} />
          <Path d="M15 10h2a2 2 0 0 1 0 4h-2" stroke={color} strokeWidth={sw} />
          <Line x1="3" y1="20" x2="18" y2="20" stroke={color} strokeWidth={sw} />
        </Svg>
      );
    case 'transport':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="8" width="18" height="7" rx="2" stroke={color} strokeWidth={sw} />
          <Circle cx="7" cy="16.5" r="1.5" fill={color} />
          <Circle cx="17" cy="16.5" r="1.5" fill={color} />
        </Svg>
      );
    case 'shopping':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M5 7h14l-1.3 9H6.3L5 7Zm2-3v3m10-3v3" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'subscription':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x="6" y="3" width="12" height="18" rx="2" stroke={color} strokeWidth={sw} />
          <Line x1="9" y1="7" x2="15" y2="7" stroke={color} strokeWidth={sw} />
          <Circle cx="12" cy="17.5" r="1" fill={color} />
        </Svg>
      );
    case 'transfer':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M5 8h10m0 0-3-3m3 3-3 3M19 16H9m0 0 3-3m-3 3 3 3" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'salary':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth={sw} />
          <Path d="M14.5 9.5c0-1-1.1-1.8-2.5-1.8s-2.5.8-2.5 1.8 1.1 1.8 2.5 1.8 2.5.8 2.5 1.8-1.1 1.8-2.5 1.8-2.5-.8-2.5-1.8M12 6.5v11" stroke={color} strokeWidth={sw - 0.2} strokeLinecap="round" />
        </Svg>
      );
    case 'entertainment':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x="4" y="7" width="16" height="10" rx="2" stroke={color} strokeWidth={sw} />
          <Path d="m10 10 5 2-5 2v-4Z" fill={color} />
        </Svg>
      );
    case 'health':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.4-7 10-7 10Z" stroke={color} strokeWidth={sw} />
          <Line x1="12" y1="9" x2="12" y2="14" stroke={color} strokeWidth={sw} />
          <Line x1="9.5" y1="11.5" x2="14.5" y2="11.5" stroke={color} strokeWidth={sw} />
        </Svg>
      );
    case 'education':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="m3 9 9-4 9 4-9 4-9-4Z" stroke={color} strokeWidth={sw} strokeLinejoin="round" />
          <Path d="M7 11.2V15c0 .8 2.2 2 5 2s5-1.2 5-2v-3.8" stroke={color} strokeWidth={sw} />
        </Svg>
      );
    case 'bills':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M7 3h10v18l-2-1.5L13 21l-2-1.5L9 21l-2-1.5L5 21V5a2 2 0 0 1 2-2Z" stroke={color} strokeWidth={sw} />
          <Line x1="9" y1="9" x2="15" y2="9" stroke={color} strokeWidth={sw} />
          <Line x1="9" y1="13" x2="15" y2="13" stroke={color} strokeWidth={sw} />
        </Svg>
      );
    case 'other':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={sw} />
          <Circle cx="12" cy="12" r="1.5" fill={color} />
        </Svg>
      );
    default:
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={sw} />
        </Svg>
      );
  }
}

export function categoryIconName(id?: string): IconName {
  switch (id) {
    case 'food': return 'food';
    case 'cafe': return 'cafe';
    case 'transport': return 'transport';
    case 'shopping': return 'shopping';
    case 'subscription': return 'subscription';
    case 'transfer': return 'transfer';
    case 'salary': return 'salary';
    case 'entertainment': return 'entertainment';
    case 'health': return 'health';
    case 'education': return 'education';
    case 'bills': return 'bills';
    default: return 'other';
  }
}
