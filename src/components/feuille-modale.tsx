import { useEcran } from '@/hooks/use-ecran'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

type ProprietesFeuilleModale = {
  ouvert: boolean
  onFermer: () => void
  titre: string
  description?: string
  children: React.ReactNode
  classNameContenu?: string
  pleinEcranMobile?: boolean
}

/**
 * Modale adaptative : bottom sheet sur mobile, dialog centré sur bureau.
 */
export function FeuilleModale({
  ouvert,
  onFermer,
  titre,
  description,
  children,
  classNameContenu,
  pleinEcranMobile = false,
}: ProprietesFeuilleModale) {
  const { estMobile } = useEcran()

  if (estMobile) {
    return (
      <Sheet
        open={ouvert}
        onOpenChange={(o) => {
          if (!o) onFermer()
        }}
      >
        <SheetContent
          side='bottom'
          className={cn(
            'flex flex-col gap-0 rounded-t-xl p-0',
            pleinEcranMobile
              ? 'h-[95dvh]'
              : 'max-h-[90dvh]',
            classNameContenu
          )}
        >
          <SheetHeader className='border-b border-border px-4 py-3 text-left'>
            <SheetTitle>{titre}</SheetTitle>
            {description ? (
              <SheetDescription>{description}</SheetDescription>
            ) : null}
          </SheetHeader>
          <div className='min-h-0 flex-1 overflow-y-auto px-4 py-4'>
            {children}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog
      open={ouvert}
      onOpenChange={(o) => {
        if (!o) onFermer()
      }}
    >
      <DialogContent className={cn('max-h-[90vh] overflow-y-auto sm:max-w-lg', classNameContenu)}>
        <DialogHeader>
          <DialogTitle>{titre}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
