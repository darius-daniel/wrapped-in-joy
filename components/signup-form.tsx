"use client";

import { cn } from "cn";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { SelectContent } from "./ui/select";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedNumber, setSelectedNumber] = useState("");

  const items = [
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
    { label: "System", value: "system" },
  ];

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-xl font-bold">Silent Night, Secret Gifts.</h1>
            <FieldDescription>
              Pick your number and discover the joy of giving
            </FieldDescription>
          </div>

          <Field>
            <FieldLabel htmlFor="name">Your Name:</FieldLabel>
            <Input
              id="name"
              type="tel"
              placeholder="John Doe"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="phone">Phone/WhatsApp Number</FieldLabel>
            <Input
              id="phone"
              type="tel"
              placeholder="+234 XXX XXX XXX"
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="phone">Who will you gift to?</FieldLabel>
            <Select items={items}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {items.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <Button type="submit">Submit</Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
