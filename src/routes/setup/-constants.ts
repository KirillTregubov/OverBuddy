export const containerVariants = {
  show: {
    transition: {
      staggerChildren: 0.02
    }
  }
}

export const childVariants = {
  hidden: { transform: 'translateY(20px)' },
  show: {
    transform: 'translateY(0)',
    transition: {
      duration: 0.3
    }
  }
}
