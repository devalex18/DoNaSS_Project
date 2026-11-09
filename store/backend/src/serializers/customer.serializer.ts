import { Customer } from '@prisma/client';

export interface PublicCustomerDto {
  id: number;
  name: string;
  phone: string;
  socialMediaProfile: string | null;
}

export function serializeCustomer(customer: Customer): PublicCustomerDto {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    socialMediaProfile: customer.socialMediaProfile ?? null,
  };
}