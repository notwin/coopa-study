import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { ChapterView } from '../../src/sidebar/ChapterView';
import type { Chapter } from '../../src/types';

const chapter: Chapter = {
  id: 'intro',
  title: '开场',
  summary: '这是摘要',
  blocks: [
    { type: 'tip', body: '小提示' },
    { type: 'explainer', title: '概念', body: '正文' }
  ]
};

describe('<ChapterView/>', () => {
  it('渲染标题和摘要', () => {
    render(<ChapterView chapter={chapter}/>);
    expect(screen.getByRole('heading', { name: '开场' })).toBeInTheDocument();
    expect(screen.getByText('这是摘要')).toBeInTheDocument();
  });

  it('按 blocks 顺序渲染内容', () => {
    render(<ChapterView chapter={chapter}/>);
    expect(screen.getByText('小提示')).toBeInTheDocument();
    expect(screen.getByText('概念')).toBeInTheDocument();
  });
});
