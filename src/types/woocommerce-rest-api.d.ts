declare module '@woocommerce/woocommerce-rest-api' {
  export interface WooCommerceRestApiOptions {
    url: string;
    consumerKey: string;
    consumerSecret: string;
    version: string;
  }

  export interface WooCommerceRestApiResponse {
    data: any;
    status: number;
  }

  export default class WooCommerceRestApi {
    constructor(options: WooCommerceRestApiOptions);
    get(endpoint: string): Promise<WooCommerceRestApiResponse>;
    post(endpoint: string, data: any): Promise<WooCommerceRestApiResponse>;
    put(endpoint: string, data: any): Promise<WooCommerceRestApiResponse>;
    delete(endpoint: string): Promise<WooCommerceRestApiResponse>;
  }
} 