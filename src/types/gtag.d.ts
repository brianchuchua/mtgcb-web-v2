interface Window {
  gtag?: (
    command: 'config' | 'event' | 'set',
    targetId: string,
    config?: {
      page_path?: string;
      page_location?: string;
      page_title?: string;
      send_page_view?: boolean;
      debug_mode?: boolean;
      [key: string]: any;
    }
  ) => void;
  dataLayer?: any[];
}