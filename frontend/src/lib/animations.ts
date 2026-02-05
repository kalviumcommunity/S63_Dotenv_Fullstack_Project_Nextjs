/**
 * Animation utilities with motion preference support
 * Respects prefers-reduced-motion for accessibility
 */

import { Variants, Transition } from "framer-motion";

export const prefersReducedMotion = (): boolean => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Safe animation variants that respect motion preferences
 */
export const safeVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
};

/**
 * Page transition configuration
 */
export const pageTransition: Transition = {
  duration: prefersReducedMotion() ? 0 : 0.3,
  ease: [0.22, 1, 0.36, 1], // Custom easing for premium feel
};

/**
 * Micro-interaction transitions
 */
export const microTransitions = {
  button: {
    duration: prefersReducedMotion() ? 0 : 0.2,
    ease: "easeOut",
  },
  card: {
    duration: prefersReducedMotion() ? 0 : 0.25,
    ease: [0.22, 1, 0.36, 1],
  },
  form: {
    duration: prefersReducedMotion() ? 0 : 0.2,
    ease: "easeOut",
  },
};

/**
 * Button animation variants
 */
export const buttonVariants: Variants = {
  idle: {
    scale: 1,
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
  },
  hover: {
    scale: prefersReducedMotion() ? 1 : 1.02,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    transition: microTransitions.button,
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
  loading: {
    scale: 1,
    opacity: 0.7,
  },
};

/**
 * Card animation variants
 */
export const cardVariants: Variants = {
  idle: {
    y: 0,
    scale: 1,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  hover: {
    y: prefersReducedMotion() ? 0 : -4,
    scale: prefersReducedMotion() ? 1 : 1.01,
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    transition: microTransitions.card,
  },
  focus: {
    scale: 1.01,
    boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
    transition: microTransitions.card,
  },
};

/**
 * Form input animation variants
 */
export const inputVariants: Variants = {
  idle: {
    scale: 1,
    borderColor: "rgba(229, 231, 235, 1)",
  },
  focus: {
    scale: prefersReducedMotion() ? 1 : 1.01,
    borderColor: "rgba(59, 130, 246, 1)",
    transition: microTransitions.form,
  },
  error: {
    x: prefersReducedMotion() ? 0 : [0, -4, 4, -4, 0],
    borderColor: "rgba(239, 68, 68, 1)",
    transition: { duration: 0.3 },
  },
  success: {
    borderColor: "rgba(34, 197, 94, 1)",
    transition: microTransitions.form,
  },
};

/**
 * Skeleton loader animation
 */
export const skeletonVariants: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: prefersReducedMotion() ? 0 : 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};
