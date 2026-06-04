import { Animation, AnimationBuilder, createAnimation } from '@ionic/angular';

const REFLECT_TAB_PAGE_TAGS = new Set(['app-home', 'app-history', 'app-tools', 'app-profile']);
const TAB_TRANSITION_DURATION_MS = 220;
const TAB_TRANSITION_EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

export const reflectTabTransitionAnimation: AnimationBuilder = (_baseEl, opts): Animation => {
  const enteringEl = opts?.enteringEl as HTMLElement | undefined;
  const leavingEl = opts?.leavingEl as HTMLElement | undefined;

  if (!isReflectTabPage(enteringEl) && !isReflectTabPage(leavingEl)) {
    return createAnimation('reflect-tab-transition-skip').duration(0);
  }

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = prefersReducedMotion ? 0 : TAB_TRANSITION_DURATION_MS;
  const rootAnimation = createAnimation('reflect-tab-transition')
    .duration(duration)
    .easing(TAB_TRANSITION_EASING);

  if (enteringEl) {
    const enteringAnimation = createAnimation('reflect-tab-enter')
      .addElement(enteringEl)
      .beforeRemoveClass('ion-page-hidden')
      .beforeStyles({
        opacity: '0.001',
        transform: 'translateY(4px)',
        zIndex: '2',
      })
      .fromTo('opacity', '0.001', '1')
      .fromTo('transform', 'translateY(4px)', 'translateY(0)')
      .afterClearStyles(['opacity', 'transform', 'z-index']);

    rootAnimation.addAnimation(enteringAnimation);
  }

  if (leavingEl) {
    const leavingAnimation = createAnimation('reflect-tab-leave')
      .addElement(leavingEl)
      .beforeStyles({
        zIndex: '1',
      })
      .fromTo('opacity', '1', '0.96')
      .fromTo('transform', 'translateY(0)', 'translateY(-2px)')
      .afterClearStyles(['opacity', 'transform', 'z-index']);

    rootAnimation.addAnimation(leavingAnimation);
  }

  return rootAnimation;
};

function isReflectTabPage(element: HTMLElement | undefined): boolean {
  return element ? REFLECT_TAB_PAGE_TAGS.has(element.tagName.toLowerCase()) : false;
}
