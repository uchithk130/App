import Link from "next/link";

type RowProps = {
  prompt: string;
  href: string;
  linkLabel: string;
};

export function AuthFooterLinkRow({ prompt, href, linkLabel }: RowProps) {
  return (
    <p className="text-center text-sm text-slate-600">
      {prompt}{" "}
      <Link href={href} className="font-semibold text-emerald-700 underline-offset-4 hover:underline">
        {linkLabel}
      </Link>
    </p>
  );
}
