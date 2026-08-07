const steps = ["Presentes", "Seus dados", "Pagamento", "Confirmação"];

export function CheckoutProgress({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <ol className="mx-auto mb-8 flex max-w-2xl items-start" aria-label="Etapas do pagamento">
      {steps.map((step, index) => {
        const number = index + 1;
        const complete = number < current;
        const active = number === current;
        return (
          <li key={step} className="relative flex flex-1 flex-col items-center text-center">
            {index > 0 ? (
              <span
                className={`absolute right-1/2 top-4 h-0.5 w-full ${number <= current ? "bg-primary" : "bg-border"}`}
              />
            ) : null}
            <span
              className={`relative z-10 flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold ${complete || active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"}`}
              aria-current={active ? "step" : undefined}
            >
              {complete ? "✓" : number}
            </span>
            <span
              className={`mt-2 text-[10px] sm:text-xs ${active ? "font-bold text-foreground" : "text-muted-foreground"}`}
            >
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
