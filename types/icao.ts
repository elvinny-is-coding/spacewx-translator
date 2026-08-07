// types/icao.ts

export interface IcaoAdvisory {
  advisory_number: string;
  issue_time: string;
  valid_time_begin: string;
  valid_time_end: string;
  phenomenon: string;
  region: string;
  advisory_text: string;
}

export interface IcaoAdvisoryResponse {
  advisories: IcaoAdvisory[];
  lastChecked: string;
}
