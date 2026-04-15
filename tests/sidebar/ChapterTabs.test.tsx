import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { ChapterTabs } from '../../src/sidebar/ChapterTabs';

const chapters = [
  { id: 'a', title: '第一关', summary: '', blocks: [] as any },
  { id: 'b', title: '第二关', summary: '', blocks: [] as any }
];

describe('<ChapterTabs/>', () => {
  it('渲染所有章节按钮', () => {
    const onChange = vi.fn();
    render(<ChapterTabs chapters={chapters as any} currentId="a" onChange={onChange}/>);
    expect(screen.getByRole('tab', { name: '第一关' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '第二关' })).toBeInTheDocument();
  });

  it('currentId 对应章节标记 aria-selected', () => {
    const onChange = vi.fn();
    render(<ChapterTabs chapters={chapters as any} currentId="b" onChange={onChange}/>);
    expect(screen.getByRole('tab', { name: '第二关' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: '第一关' })).toHaveAttribute('aria-selected', 'false');
  });

  it('点击章节按钮触发 onChange', () => {
    const onChange = vi.fn();
    render(<ChapterTabs chapters={chapters as any} currentId="a" onChange={onChange}/>);
    fireEvent.click(screen.getByRole('tab', { name: '第二关' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
