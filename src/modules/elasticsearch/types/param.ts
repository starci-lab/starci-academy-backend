import {
    estypes 
} from "@elastic/elasticsearch"

export interface SearchParam {
  query: estypes.SearchRequest["query"];
  sort?: any;
  from?: number;
  size?: number;
}
