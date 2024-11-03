interface DaumPostcodeData {
  address: string;
  addressType: string;
  bname: string;
  buildingName: string;
  zonecode: string;
  [key: string]: string;
}

interface DaumPostcode {
  open: () => void;
  embed: (container: HTMLElement, options?: any) => void;
}

interface DaumPostcodeConstructor {
  new (options: { oncomplete: (data: DaumPostcodeData) => void }): DaumPostcode;
}

interface Window {
  daum: {
    Postcode: DaumPostcodeConstructor;
  };
} 