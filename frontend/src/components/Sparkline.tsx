import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface SparklineProps {
  color: string;
  trend: 'up' | 'down'; // To determine general direction of random data
}

const Sparkline: React.FC<SparklineProps> = ({ color, trend }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Generate fake data (10 points)
    const points = 10;
    const data = Array.from({ length: points }, (_, i) => {
       const base = trend === 'up' ? i : (points - i);
       return base + Math.random() * 5;
    });

    // Clear
    d3.select(svgRef.current).selectAll('*').remove();

    const width = 100;
    const height = 30;
    const margin = 2;

    const svg = d3.select(svgRef.current)
        .attr('width', width)
        .attr('height', height);

    const x = d3.scaleLinear().domain([0, points - 1]).range([margin, width - margin]);
    const y = d3.scaleLinear().domain([0, 15]).range([height - margin, margin]); // approx range

    const line = d3.line<number>()
        .x((_, i) => x(i))
        .y(d => y(d))
        .curve(d3.curveBasis); // Smooth curve

    svg.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('d', line);
        
    // Area (optional for "Bar mini chart" look, but line is safer for generic "sparkline")
    
  }, [color, trend]);

  return <svg ref={svgRef} />;
};

export default React.memo(Sparkline);
