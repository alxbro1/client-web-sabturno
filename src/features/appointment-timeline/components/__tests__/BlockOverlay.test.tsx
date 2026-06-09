import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BlockOverlay } from '../BlockOverlay';
import type { Block } from '../../types';

const makeBlock = (overrides?: Partial<Block>): Block => ({
  id: 'block-1',
  resourceId: 'local-1',
  startAt: new Date(2026, 0, 1, 13, 0),
  endAt: new Date(2026, 0, 1, 14, 0),
  notes: 'Mantenimiento',
  ...overrides,
});

function getBlockElement(text: string): HTMLElement {
  return screen.getByText(text).closest('div[class*="absolute"]') as HTMLElement;
}

describe('BlockOverlay', () => {
  it('should render block with notes text', () => {
    render(
      <BlockOverlay
        block={makeBlock()}
        top={100}
        height={44}
        width={200}
        theme="light"
      />,
    );

    expect(screen.getByText('Mantenimiento')).toBeInTheDocument();
  });

  it('should render "Bloqueado" when no notes', () => {
    render(
      <BlockOverlay
        block={makeBlock({ notes: undefined })}
        top={100}
        height={44}
        width={200}
        theme="light"
      />,
    );

    expect(screen.getByText('Bloqueado')).toBeInTheDocument();
  });

  it('should apply correct positioning styles', () => {
    render(
      <BlockOverlay
        block={makeBlock()}
        top={200}
        height={88}
        width={300}
        theme="light"
      />,
    );

    const el = getBlockElement('Mantenimiento');
    expect(el.style.top).toBe('200px');
    expect(el.style.height).toBe('88px');
    expect(el.style.width).toBe('300px');
  });

  it('should have z-[5] to stay below appointments', () => {
    render(
      <BlockOverlay
        block={makeBlock()}
        top={100}
        height={44}
        width={200}
      />,
    );

    const el = getBlockElement('Mantenimiento');
    expect(el.className).toContain('z-[5]');
  });

  it('should apply cursor-pointer when onClick is provided', () => {
    render(
      <BlockOverlay
        block={makeBlock()}
        top={100}
        height={44}
        width={200}
        onClick={() => {}}
      />,
    );

    const el = getBlockElement('Mantenimiento');
    expect(el.className).toContain('cursor-pointer');
  });

  it('should apply cursor-default when no onClick', () => {
    render(
      <BlockOverlay
        block={makeBlock()}
        top={100}
        height={44}
        width={200}
      />,
    );

    const el = getBlockElement('Mantenimiento');
    expect(el.className).toContain('cursor-default');
  });

  it('should apply light theme border colors by default', () => {
    render(
      <BlockOverlay
        block={makeBlock()}
        top={100}
        height={44}
        width={200}
      />,
    );

    const el = getBlockElement('Mantenimiento');
    expect(el.className).toContain('border-slate-300');
  });

  it('should apply dark theme border colors', () => {
    render(
      <BlockOverlay
        block={makeBlock()}
        top={100}
        height={44}
        width={200}
        theme="dark"
      />,
    );

    const el = getBlockElement('Mantenimiento');
    expect(el.className).toContain('border-slate-600');
  });

  it('should enforce minHeight of 20', () => {
    render(
      <BlockOverlay
        block={makeBlock()}
        top={100}
        height={5}
        width={200}
      />,
    );

    const el = getBlockElement('Mantenimiento');
    expect(el.style.minHeight).toBe('20px');
  });
});
