import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { TermBlock } from '../../../src/sidebar/blocks/TermBlock';

const block = {
  type: 'term' as const,
  term: '数据集',
  en: 'dataset',
  definition: '一批数据的集合',
  analogy: '像一摞笔记本'
};

describe('<TermBlock/>', () => {
  it('默认只显示正面（term + en）', () => {
    render(<TermBlock block={block}/>);
    expect(screen.getByText('数据集')).toBeInTheDocument();
    expect(screen.getByText('dataset')).toBeInTheDocument();
    expect(screen.queryByText('一批数据的集合')).not.toBeInTheDocument();
  });

  it('点正面翻到背面显示 definition 和 analogy', () => {
    render(<TermBlock block={block}/>);
    fireEvent.click(screen.getByRole('button', { name: /数据集/ }));
    expect(screen.getByText('一批数据的集合')).toBeInTheDocument();
    expect(screen.getByText('像一摞笔记本')).toBeInTheDocument();
  });

  it('点背面翻回正面', () => {
    render(<TermBlock block={block}/>);
    fireEvent.click(screen.getByRole('button', { name: /数据集/ }));
    fireEvent.click(screen.getByText('一批数据的集合').parentElement!);
    expect(screen.queryByText('一批数据的集合')).not.toBeInTheDocument();
  });
});
