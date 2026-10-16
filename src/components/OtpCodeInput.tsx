import { REGEXP_ONLY_DIGITS } from "input-otp";

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export const OTP_LENGTH = 6;

interface OtpCodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  id?: string;
}

export function OtpCodeInput({
  value,
  onChange,
  onComplete,
  disabled,
  autoFocus,
  id,
}: OtpCodeInputProps) {
  return (
    <div dir="ltr" className="flex justify-center">
      <InputOTP
        id={id}
        maxLength={OTP_LENGTH}
        pattern={REGEXP_ONLY_DIGITS}
        value={value}
        onChange={onChange}
        {...(onComplete ? { onComplete } : {})}
        disabled={disabled ?? false}
        autoFocus={autoFocus ?? false}
        autoComplete="one-time-code"
      >
        <InputOTPGroup>
          {Array.from({ length: OTP_LENGTH }, (_, index) => (
            <InputOTPSlot key={index} index={index} className="h-11 w-11 text-base" />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}
