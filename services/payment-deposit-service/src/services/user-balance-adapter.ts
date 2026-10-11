/**
 * User Balance Adapter
 * 
 * If your user accounts live in an external database (e.g. MongoDB, MySQL, Firebase,
 * or your main platform API), you can customize this adapter to increment balance
 * directly in your existing system.
 */

export interface ExternalBalanceUpdate {
  userId: string;
  amount: number;
  trxId: string;
  provider: string;
}

export class UserBalanceAdapter {
  /**
   * Example: Call your existing platform REST API or external database
   */
  public static async creditExternalUserBalance(data: ExternalBalanceUpdate): Promise<{ newBalance?: number }> {
    // If you want to forward the credit to an external API endpoint:
    /*
    const response = await fetch(`${process.env.EXISTING_API_URL}/api/users/${data.userId}/credit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_TOKEN}`
      },
      body: JSON.stringify({
        amount: data.amount,
        trx_id: data.trxId,
        provider: data.provider
      })
    });
    return await response.json();
    */

    // Default: Managed directly by the microservice's User model
    return {};
  }
}
