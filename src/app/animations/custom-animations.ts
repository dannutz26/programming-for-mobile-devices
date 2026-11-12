import { Animation, createAnimation } from '@ionic/angular';

/**
 * Custom Modal Enter Animation
 * Overrides Ionic's default modal enter animation with a custom scale + slide + fade effect.
 */
export const customModalEnterAnimation = (baseEl: HTMLElement): Animation => {
  const root = baseEl.shadowRoot || baseEl;
  const backdropAnimation = createAnimation()
    .addElement(root.querySelector('ion-backdrop')!)
    .fromTo('opacity', '0.01', 'var(--backdrop-opacity, 0.4)');

  const wrapperAnimation = createAnimation()
    .addElement(root.querySelector('.modal-wrapper')!)
    .keyframes([
      { offset: 0, opacity: '0', transform: 'scale(0.8) translateY(40px)' },
      { offset: 0.7, opacity: '1', transform: 'scale(1.02) translateY(-5px)' },
      { offset: 1, opacity: '1', transform: 'scale(1) translateY(0)' },
    ]);

  return createAnimation()
    .addElement(baseEl)
    .easing('cubic-bezier(0.36,0.66,0.04,1)')
    .duration(320)
    .addAnimation([backdropAnimation, wrapperAnimation]);
};

/**
 * Custom Modal Leave Animation
 * Overrides Ionic's default modal leave animation.
 */
export const customModalLeaveAnimation = (baseEl: HTMLElement): Animation => {
  const root = baseEl.shadowRoot || baseEl;
  const backdropAnimation = createAnimation()
    .addElement(root.querySelector('ion-backdrop')!)
    .fromTo('opacity', 'var(--backdrop-opacity, 0.4)', '0');

  const wrapperAnimation = createAnimation()
    .addElement(root.querySelector('.modal-wrapper')!)
    .keyframes([
      { offset: 0, opacity: '1', transform: 'scale(1) translateY(0)' },
      { offset: 1, opacity: '0', transform: 'scale(0.85) translateY(30px)' },
    ]);

  return createAnimation()
    .addElement(baseEl)
    .easing('ease-in-out')
    .duration(240)
    .addAnimation([backdropAnimation, wrapperAnimation]);
};

/**
 * Custom Page Navigation Transition
 * Overrides Ionic's built-in router/nav transition across pages.
 */
export const customNavAnimation = (baseEl: HTMLElement, opts?: any): Animation => {
  const enteringEl = opts?.enteringEl as HTMLElement;
  const leavingEl = opts?.leavingEl as HTMLElement;

  const rootTransition = createAnimation().duration(280).easing('cubic-bezier(0.25, 0.8, 0.25, 1)');

  if (enteringEl) {
    const enteringAnimation = createAnimation()
      .addElement(enteringEl)
      .fromTo('opacity', '0', '1')
      .fromTo('transform', opts?.direction === 'back' ? 'translateX(-30px)' : 'translateX(40px)', 'translateX(0px)');
    rootTransition.addAnimation(enteringAnimation);
  }

  if (leavingEl) {
    const leavingAnimation = createAnimation()
      .addElement(leavingEl)
      .fromTo('opacity', '1', '0')
      .fromTo('transform', 'translateX(0px)', opts?.direction === 'back' ? 'translateX(40px)' : 'translateX(-30px)');
    rootTransition.addAnimation(leavingAnimation);
  }

  return rootTransition;
};

/**
 * Animate a component with a pulse / scale effect (e.g. FAB button, action buttons)
 */
export const pulseElement = (el: HTMLElement, duration = 400): Animation => {
  return createAnimation()
    .addElement(el)
    .duration(duration)
    .easing('ease-in-out')
    .keyframes([
      { offset: 0, transform: 'scale(1)' },
      { offset: 0.5, transform: 'scale(1.2)' },
      { offset: 1, transform: 'scale(1)' },
    ]);
};

/**
 * Animate a component with a slide and fade in
 */
export const slideFadeIn = (el: HTMLElement, delay = 0): Animation => {
  return createAnimation()
    .addElement(el)
    .duration(350)
    .delay(delay)
    .easing('cubic-bezier(0.25, 1, 0.5, 1)')
    .fromTo('opacity', '0', '1')
    .fromTo('transform', 'translateY(20px)', 'translateY(0)');
};
