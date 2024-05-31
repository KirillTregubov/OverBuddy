export default function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <span className="select-all whitespace-nowrap rounded bg-zinc-800 px-1.5 pb-0.5 pt-px">
      {children}
    </span>
  )
}
