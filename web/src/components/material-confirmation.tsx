"use client";

type MaterialConfirmationProps = {
  fileName: string;
  text: string;
  warnings: string[];
  onTextChange: (text: string) => void;
  onBack: () => void;
  onContinue: () => void;
  busy: boolean;
};

export function MaterialConfirmation(props: MaterialConfirmationProps) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-teal-700">材料确认</p>
          <h2 className="mt-1 text-lg font-semibold text-neutral-950">
            检查系统识别的简历内容
          </h2>
          <p className="mt-1 text-sm text-neutral-600">{props.fileName}</p>
        </div>
        <button type="button" onClick={props.onBack} className="text-sm text-neutral-600">
          重新选择
        </button>
      </div>

      {props.warnings.map((warning) => (
        <p key={warning} className="mt-4 border-l-2 border-amber-500 pl-3 text-sm text-amber-800">
          {warning}
        </p>
      ))}

      <label className="mt-5 block text-sm font-medium text-neutral-800">
        简历原文
        <textarea
          value={props.text}
          onChange={(event) => props.onTextChange(event.target.value)}
          className="mt-2 min-h-80 w-full resize-y rounded-md border border-neutral-300 p-3 text-sm leading-6 outline-none focus:border-teal-700"
        />
      </label>
      <button
        type="button"
        disabled={props.busy || !props.text.trim()}
        onClick={props.onContinue}
        className="mt-4 min-h-11 rounded-md bg-neutral-950 px-5 text-sm font-medium text-white disabled:opacity-50"
      >
        {props.busy ? "正在保存…" : "确认材料并继续"}
      </button>
    </section>
  );
}
