import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { TipBlock } from '../../../src/sidebar/blocks/TipBlock';

describe('<TipBlock/>', () => {
  it('渲染 body', () => {
    render(<TipBlock block={{ type: 'tip', body: '别跳过开场' }}/>);
    expect(screen.getByText('别跳过开场')).toBeInTheDocument();
  });
});
