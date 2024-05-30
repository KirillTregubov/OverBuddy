export const fadeInVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: 1
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
  hidden: { transform: 'translateY(20px)' },
  show: {
    transform: 'translateY(0)',
    transition: {
      duration: 0.3
    }
  }
}
