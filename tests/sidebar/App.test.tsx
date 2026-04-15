import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { App } from '../../src/sidebar/App';
import pack from '../../src/companion-packs/flood-forecasting.json';
import type { CompanionPack } from '../../src/types';

describe('<App/>', () => {
  it('默认折叠态只显示细条', () => {
    render(<App pack={pack as CompanionPack} initialCollapsed={true}/>);
    expect(screen.getByRole('button', { name: /展开伴读/ })).toBeInTheDocument();
    expect(screen.queryByText('洪水预测')).not.toBeInTheDocument();
  });

  it('点细条展开显示标题', () => {
    render(<App pack={pack as CompanionPack} initialCollapsed={true}/>);
    fireEvent.click(screen.getByRole('button', { name: /展开伴读/ }));
    expect(screen.getByText('中文伴读 · 洪水预测')).toBeInTheDocument();
  });

  it('点收起按钮变回折叠态', () => {
    render(<App pack={pack as CompanionPack} initialCollapsed={false}/>);
    fireEvent.click(screen.getByRole('button', { name: /收起伴读/ }));
    expect(screen.getByRole('button', { name: /展开伴读/ })).toBeInTheDocument();
  });
});
