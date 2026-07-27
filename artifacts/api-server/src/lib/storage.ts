import { db, usersTable } from '@workspace/db';
import { eq } from 'drizzle-orm';
import type { User } from '@workspace/db';

export class Storage {
  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    return user ?? null;
  }

  async getUserByCustomerId(customerId: string): Promise<User | null> {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.stripeCustomerId, customerId));
    return user ?? null;
  }

  async createUser(email: string): Promise<User> {
    const [user] = await db
      .insert(usersTable)
      .values({ id: crypto.randomUUID(), email })
      .returning();
    return user;
  }

  async upsertUser(email: string): Promise<User> {
    const existing = await this.getUserByEmail(email);
    if (existing) return existing;
    return this.createUser(email);
  }

  async updateUserStripeInfo(
    email: string,
    data: {
      stripeCustomerId?: string;
      stripeSubscriptionId?: string | null;
      subscriptionStatus?: string | null;
      subscriptionPlan?: string | null;
      currentPeriodEnd?: Date | null;
    },
  ): Promise<User | null> {
    const [user] = await db
      .update(usersTable)
      .set(data)
      .where(eq(usersTable.email, email))
      .returning();
    return user ?? null;
  }

  async updateUserByCustomerId(
    customerId: string,
    data: {
      stripeSubscriptionId?: string | null;
      subscriptionStatus?: string | null;
      subscriptionPlan?: string | null;
      currentPeriodEnd?: Date | null;
    },
  ): Promise<User | null> {
    const [user] = await db
      .update(usersTable)
      .set(data)
      .where(eq(usersTable.stripeCustomerId, customerId))
      .returning();
    return user ?? null;
  }
}

export const storage = new Storage();
