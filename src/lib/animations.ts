export const fadeInVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: 0.3
      // ease: 'easeInOut'
    }
  }
}

export const fadeInFastVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: 0.2
      // ease: 'easeInOut'
    }
  }
}

export const staggerChildrenVariants = {
  show: {
    transition: {
      staggerChildren: 0.02
    }
  }
}

export const moveInVariants = {
  hidden: { transform: 'translateY(16px)' },
  show: {
    transform: 'translateY(0)',
    transition: {
      duration: 0.3
    }
  }
}

export const moveInLessVariants = {
  hidden: { transform: 'translateY(8px)' },
  show: {
    transform: 'translateY(0)',
    transition: {
      duration: 0.3
    }
  }
}

export const fadeMoveInVariants = {
  hidden: {
    ...fadeInVariants.hidden,
    ...moveInVariants.hidden
  },
  show: {
    ...fadeInVariants.show,
    ...moveInVariants.show
  }
}
