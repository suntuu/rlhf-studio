export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export const inputClass =
  'w-full rounded-lg border border-[#d9d5cd] bg-[#fffdf9] px-3 py-2 text-sm text-neutral-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] outline-none transition duration-200 placeholder:text-neutral-400 focus:border-[#202936] focus:ring-4 focus:ring-neutral-900/10 disabled:bg-[#efede8] disabled:text-neutral-500'

export const textareaClass = `${inputClass} min-h-28 resize-y leading-6`
