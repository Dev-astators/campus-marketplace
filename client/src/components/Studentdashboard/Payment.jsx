"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardBody, CardHeader } from "@nextui-org/react";
import { Input } from "@nextui-org/input";
import { toast } from "react-toastify";
import { PaystackButton } from "react-paystack";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  amount: z.coerce
    .number()
    .min(100, "Minimum amount is 100")
    .max(1000000, "Maximum amount is 1000000"),
});

export default function PayStackPayment() {
  // eslint-disable-next-line no-undef
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";

  if (!publicKey) {
    toast.error("PayStack public key is not set");
  }

  const {
    register,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(schema),
  });

  const email = watch("email");
  const amount = watch("amount");

  const paystackConfig = {
    email,
    amount: amount * 100,
    publicKey,
    currency: "NGN",

    metadata: {
      custom_fields: [
        {
          display_name: "Email",
          variable_name: "email",
          value: email,
        },
        {
          display_name: "Amount",
          variable_name: "amount",
          value: amount,
        },
      ],
    },

    onSuccess: () => {
      toast.success("Payment successful");

      reset({
        email: "",
        amount: "",
      });
    },

    onClose: () => {
      toast.error("Payment cancelled");
    },

    onError: () => {
      toast.error("Payment failed");
    },
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md shadow-xl bg-white p-6">
        <CardHeader className="text-center py-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Pay with PayStack
          </h2>
        </CardHeader>

        <CardBody>
          <div className="flex flex-col space-y-4 text-gray-600">
            <Input
              {...register("email")}
              label="Email Address"
              type="email"
              variant="faded"
              size="lg"
              isRequired
            />

            {errors.email && (
              <p className="text-sm text-red-500">
                {errors.email.message}
              </p>
            )}

            <Input
              {...register("amount")}
              label="Amount (NGN)"
              type="number"
              variant="faded"
              size="lg"
              isRequired
            />

            {errors.amount && (
              <p className="text-sm text-red-500">
                {errors.amount.message}
              </p>
            )}

            {email && amount && (
              <PaystackButton
                {...paystackConfig}
                text="Pay Now"
                className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors duration-200"
              />
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}