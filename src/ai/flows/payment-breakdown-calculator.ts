'use server';
/**
 * @fileOverview Calculates the payment breakdown for a rental transaction, 
 * showing the distribution to the landlord, platform, and tenant.
 *
 * - calculatePaymentBreakdown - A function that calculates the payment breakdown.
 * - PaymentBreakdownInput - The input type for the calculatePaymentBreakdown function.
 * - PaymentBreakdownOutput - The return type for the calculatePaymentBreakdown function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PaymentBreakdownInputSchema = z.object({
  totalPrice: z.number().describe('The total price of the rental.'),
});
export type PaymentBreakdownInput = z.infer<typeof PaymentBreakdownInputSchema>;

const PaymentBreakdownOutputSchema = z.object({
  landlordPercentage: z.number().describe('The percentage of the payment that goes to the landlord.'),
  platformPercentage: z.number().describe('The percentage of the payment that goes to the platform.'),
  tenantPercentage: z.number().describe('The percentage of the payment that goes to the tenant.'),
  landlordAmount: z.number().describe('The amount of the payment that goes to the landlord.'),
  platformAmount: z.number().describe('The amount of the payment that goes to the platform.'),
  tenantAmount: z.number().describe('The amount of the payment that goes to the tenant.'),
});
export type PaymentBreakdownOutput = z.infer<typeof PaymentBreakdownOutputSchema>;

export async function calculatePaymentBreakdown(input: PaymentBreakdownInput): Promise<PaymentBreakdownOutput> {
  return paymentBreakdownFlow(input);
}

const paymentBreakdownPrompt = ai.definePrompt({
  name: 'paymentBreakdownPrompt',
  input: {schema: PaymentBreakdownInputSchema},
  output: {schema: PaymentBreakdownOutputSchema},
  prompt: `You are a financial expert specializing in real estate transactions.

  Given the total price of a rental, calculate the payment breakdown for the landlord, platform, and tenant.

  The landlord receives 90% of the total price, the platform receives 5%, and the tenant earns 5% for listing their apartment.

  Calculate the percentages and amounts for each party based on the total price.

  Total Price: {{{totalPrice}}}

  Ensure that the percentages add up to 100% and the amounts add up to the total price.
  Return the values as JSON.
  `,
});

const paymentBreakdownFlow = ai.defineFlow(
  {
    name: 'paymentBreakdownFlow',
    inputSchema: PaymentBreakdownInputSchema,
    outputSchema: PaymentBreakdownOutputSchema,
  },
  async input => {
    const {output} = await paymentBreakdownPrompt(input);
    return output!;
  }
);
