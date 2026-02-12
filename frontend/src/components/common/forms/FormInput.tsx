"use client";

import { useFormContext } from "react-hook-form";
import Input from "@/components/common/ui/Input";

interface FormInputProps {
  name: string;
  label?: string;
  type?: string;
  placeholder?: string;
  className?: string;
}

function FormInput({ name, label, type = "text", placeholder, className }: FormInputProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name]?.message as string | undefined;

  return (
    <Input
      label={label}
      type={type}
      placeholder={placeholder}
      error={error}
      className={className}
      {...register(name)}
    />
  );
}

export default FormInput;
