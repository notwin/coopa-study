import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { ExplainerBlock } from '../../../src/sidebar/blocks/ExplainerBlock';

describe('<ExplainerBlock/>', () => {
  it('渲染 title 和 body', () => {
    render(<ExplainerBlock block={{ type: 'explainer', title: '什么是 AI', body: 'AI 是...' }}/>);
    expect(screen.getByRole('heading', { name: '什么是 AI' })).toBeInTheDocument();
    expect(screen.getByText('AI 是...')).toBeInTheDocument();
  });
});
