declare module 'react-native-chartjs' {
  import { Component } from 'react';
  import { ViewStyle } from 'react-native';

  interface ChartProps {
    type: 'doughnut' | 'pie' | 'line' | 'bar' | 'radar' | 'polarArea' | 'bubble' | 'scatter';
    data: any;
    options?: any;
    width?: number;
    height?: number;
    style?: ViewStyle;
  }

  export class Chart extends Component<ChartProps> {}
} 