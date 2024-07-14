import {
  Endpoints,
  RequestTypes,
} from 'detritus-client-rest';

import { BaseCollection, emptyBaseCollection } from '../collections/basecollection';
import { BaseSet } from '../collections/baseset';
import { ShardClient } from '../client';
import {
  DetritusKeys,
  DiscordKeys,
  ImageFormats,
  SkuTypes,
} from '../constants';
import { addQuery, getQueryForImage, Snowflake, UrlQuery } from '../utils';

import {
  BaseStructure,
  BaseStructureData,
} from './basestructure';
import { Application } from './application';


const keysSku = new BaseSet<string>([
  DiscordKeys.ACCESS_TYPE,
  DiscordKeys.APPLICATION,
  DiscordKeys.APPLICATION_ID,
  DiscordKeys.CONTENT_RATING,
  DiscordKeys.CONTENT_RATING_AGENCY,
  DiscordKeys.DEPENDENT_SKU_ID,
  DiscordKeys.FEATURES,
  DiscordKeys.FLAGS,
  DiscordKeys.GENRES,
  DiscordKeys.ID,
  DiscordKeys.LEGAL_NOTICE,
  DiscordKeys.LOCALES,
  DiscordKeys.MANIFEST_LABELS,
  DiscordKeys.NAME,
  DiscordKeys.PREMIUM,
  DiscordKeys.PRICE,
  DiscordKeys.RELEASE_DATE,
  DiscordKeys.SHOW_AGE_GATE,
  DiscordKeys.SLUG,
  DiscordKeys.SYSTEM_REQUIREMENTS,
  DiscordKeys.TYPE,
]);

/**
 * Sku Structure for Applications
 * @category Structure
 */
export class Sku extends BaseStructure {
  readonly _keys = keysSku;

  accessType: number = 0;
  application?: Application;
  applicationId: string = '';
  contentRating?: {descriptors: Array<number>, rating: number};
  contentRatingAgency?: number;
  dependentSkuId: null | string = null;
  features?: Array<number>;
  flags: number = 0;
  genres?: Array<number>;
  id: string = '';
  legalNotice?: string;
  locales?: Array<string>;
  manifestLabels?: Array<any> | null;
  name: string = '';
  premium?: null;
  price?: {amount: number, currency: string};
  releaseDate?: null | string;
  showAgeGate: boolean = false;
  slug: string = '';
  systemRequirements?: {[key: string]: {recommended: any, minimum: any}};
  type: SkuTypes = SkuTypes.BASE;

  constructor(client: ShardClient, data: BaseStructureData, isClone?: boolean) {
	super(client, undefined, isClone);
	this.merge(data);
  }

  get createdAt(): Date | null {
	const createdAtUnix = this.createdAtUnix;
	if (createdAtUnix !== null) {
	  return new Date(createdAtUnix);
	}
	return null;
  }

  get createdAtUnix(): null | number {
	if (this.id) {
	  return Snowflake.timestamp(this.id);
	}
	return null;
  }

  get url(): string {
    return Endpoints.Routes.URL + Endpoints.Routes.APPLICATION_STORE_LISTING_SKU(this.id, this.slug);
  }

  merge(data?: BaseStructureData): void {
	if (!data) {
	  return;
	}

    if (DiscordKeys.ACCESS_TYPE in data) {
      (this as any)[DetritusKeys[DiscordKeys.ACCESS_TYPE]] = data[DiscordKeys.ACCESS_TYPE];
    }
    if (DiscordKeys.APPLICATION in data) {
      const value = data[DiscordKeys.APPLICATION];

      let application: Application;
      if (this.isClone) {
        application = new Application(this.client, value, this.isClone);
      } else {
        if (this.client.applications.has(value.id)) {
          application = this.client.applications.get(value.id)!;
          application.merge(value);
        } else {
          application = new Application(this.client, value);
        }
      }

      (this as any)[DetritusKeys[DiscordKeys.APPLICATION]] = application;
    }
	if (DiscordKeys.APPLICATION_ID in data) {
      const applicationId = data[DiscordKeys.APPLICATION_ID];
	  (this as any)[DetritusKeys[DiscordKeys.APPLICATION_ID]] = applicationId;

      if (!this.application) {
        if (this.client.applications.has(applicationId)) {
          this.application = this.client.applications.get(applicationId)!;
          if (this.isClone) {
            this.application = this.application.clone();
          }
        }
      }
	}
    if (DiscordKeys.CONTENT_RATING in data) {
      (this as any)[DetritusKeys[DiscordKeys.CONTENT_RATING]] = data[DiscordKeys.CONTENT_RATING];
    }
    if (DiscordKeys.CONTENT_RATING_AGENCY in data) {
      (this as any)[DetritusKeys[DiscordKeys.CONTENT_RATING_AGENCY]] = data[DiscordKeys.CONTENT_RATING_AGENCY];
    }
    if (DiscordKeys.DEPENDENT_SKU_ID in data) {
      (this as any)[DetritusKeys[DiscordKeys.DEPENDENT_SKU_ID]] = data[DiscordKeys.DEPENDENT_SKU_ID];
    }
    if (DiscordKeys.FEATURES in data) {
      (this as any)[DetritusKeys[DiscordKeys.FEATURES]] = data[DiscordKeys.FEATURES];
    }
	if (DiscordKeys.FLAGS in data) {
	  (this as any)[DetritusKeys[DiscordKeys.FLAGS]] = data[DiscordKeys.FLAGS];
	}
    if (DiscordKeys.GENRES in data) {
      (this as any)[DetritusKeys[DiscordKeys.GENRES]] = data[DiscordKeys.GENRES];
    }
	if (DiscordKeys.ID in data) {
	  (this as any)[DetritusKeys[DiscordKeys.ID]] = data[DiscordKeys.ID];
	}
	if (DiscordKeys.LEGAL_NOTICE in data) {
	  (this as any)[DetritusKeys[DiscordKeys.LEGAL_NOTICE]] = data[DiscordKeys.LEGAL_NOTICE];
	}
    if (DiscordKeys.LOCALES in data) {
      (this as any)[DetritusKeys[DiscordKeys.LOCALES]] = data[DiscordKeys.LOCALES];
    }
    if (DiscordKeys.MANIFEST_LABELS in data) {
      (this as any)[DetritusKeys[DiscordKeys.MANIFEST_LABELS]] = data[DiscordKeys.MANIFEST_LABELS];
    }
    if (DiscordKeys.NAME in data) {
      (this as any)[DetritusKeys[DiscordKeys.NAME]] = data[DiscordKeys.NAME];
    }
    if (DiscordKeys.PREMIUM in data) {
      (this as any)[DetritusKeys[DiscordKeys.PREMIUM]] = data[DiscordKeys.PREMIUM];
    }
    if (DiscordKeys.PRICE in data) {
      (this as any)[DetritusKeys[DiscordKeys.PRICE]] = data[DiscordKeys.PRICE];
    }
    if (DiscordKeys.RELEASE_DATE in data) {
      (this as any)[DetritusKeys[DiscordKeys.RELEASE_DATE]] = data[DiscordKeys.RELEASE_DATE];
    }
    if (DiscordKeys.SHOW_AGE_GATE in data) {
      (this as any)[DetritusKeys[DiscordKeys.SHOW_AGE_GATE]] = data[DiscordKeys.SHOW_AGE_GATE];
    }
    if (DiscordKeys.SLUG in data) {
      (this as any)[DetritusKeys[DiscordKeys.SLUG]] = data[DiscordKeys.SLUG];
    }
    if (DiscordKeys.SYSTEM_REQUIREMENTS in data) {
      (this as any)[DetritusKeys[DiscordKeys.SYSTEM_REQUIREMENTS]] = data[DiscordKeys.SYSTEM_REQUIREMENTS];
    }
	if (DiscordKeys.TYPE in data) {
	  (this as any)[DetritusKeys[DiscordKeys.TYPE]] = data[DiscordKeys.TYPE];
	}
  }

  toString(): string {
	return this.slug;
  }
}
