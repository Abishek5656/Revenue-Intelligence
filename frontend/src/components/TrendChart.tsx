import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { TrendDataPoint } from '../api';
import { useTheme } from '@mui/material/styles';

interface TrendChartProps {
  data: TrendDataPoint[];
}

const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const theme = useTheme();

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;

    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = svgRef.current.parentElement?.clientWidth || 600;
    const height = 200;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale
    const x = d3.scaleBand()
      .domain(data.map(d => d.month))
      .range([0, innerWidth])
      .padding(0.4);

    // Y Scale
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.revenue) || 0] as [number, number])
      .range([innerHeight, 0]);

    // Bars
    svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.month)!)
      .attr('y', d => y(d.revenue))
      .attr('width', x.bandwidth())
      .attr('height', d => innerHeight - y(d.revenue))
      .attr('fill', theme.palette.secondary.main)
      .attr('rx', 4); // Rounded corners

    // Line
    const line = d3.line<TrendDataPoint>()
        .x(d => (x(d.month)! + x.bandwidth() / 2))
        .y(d => y(d.revenue))
        .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', theme.palette.primary.main)
      .attr('stroke-width', 2)
      .attr('d', line);

    // Dots
    svg.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => (x(d.month)! + x.bandwidth() / 2))
      .attr('cy', d => y(d.revenue))
      .attr('r', 4)
      .attr('fill', theme.palette.primary.main);

    // Axis
    svg.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).tickSize(0))
      .select('.domain').remove();
    
    // Add Y Axis formatted as currency
    svg.append('g')
       .call(d3.axisLeft(y).ticks(5).tickFormat(d => `$${d.valueOf()/1000}k`))
       .select('.domain').remove();

  }, [data, theme]);

  return <svg ref={svgRef} style={{ width: '100%', height: '200px' }} />;
};

export default React.memo(TrendChart);
