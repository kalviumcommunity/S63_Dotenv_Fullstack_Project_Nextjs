"use client";

import { forwardRef } from "react";
import { useFormContext } from "react-hook-form";
import Input from "@/components/common/ui/Input";

interface FormInputProps {
  name: string;
  label?: string;
  type?: string;
  placeholder?: string;
  className?: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ name, label, type = "text", placeholder, className }, ref) => {
    const {
      register,
      formState: { errors },
    } = useFormContext();

    const error = errors[name]?.message as string | undefined;

    return (
      <Input
        ref={ref}
        label={label}
        type={type}
        placeholder={placeholder}
        error={error}
        className={className}
        {...register(name)}
      />
    );
  }
);

FormInput.displayName = "FormInput";

export default FormInput;
