import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/AlertDialog'

type BackgroundApplyDialogProps = {
  actionLabel?: string
  actionTitle?: string
  children?: React.ReactNode
  disabled?: boolean
  onApply: (event: React.MouseEvent<HTMLButtonElement>) => void
  onOpenChange?: (open: boolean) => void
  open?: boolean
  title?: string
  description?: string
  trigger: React.ReactNode
}

export function BackgroundApplyDialog({
  actionLabel = 'Apply Anyway',
  actionTitle,
  children,
  disabled,
  onApply,
  onOpenChange,
  open,
  title = 'All Backgrounds Are Deprecated',
  description = 'OverBuddy now keeps these backgrounds as a demonstrational archive only, so applying a background may no longer affect your game.',
  trigger,
}: BackgroundApplyDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            Recent Overwatch updates removed support for changing the in-game
            menu background. {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onApply}
            disabled={disabled}
            title={actionTitle}
          >
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
