from __future__ import annotations
from datetime import date, datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator

class Property(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str
    source_id: str
    source_name: str
    source_url: HttpUrl
    external_listing_id: str
    title: str
    description: str | None
    property_category: Literal["land", "building", "mixed", "unknown"]
    transaction_type: Literal["government_sale", "auction", "sale"]
    county: str | None
    district: str | None
    address: str | None
    address_precision: Literal["land_parcel", "district", "unknown"]
    latitude: float | None = Field(ge=-90, le=90)
    longitude: float | None = Field(ge=-180, le=180)
    location_precision: Literal["exact", "approximate", "district", "none"]
    total_price: float | None = Field(ge=0)
    unit_price: float | None = Field(ge=0)
    building_area_ping: float | None = Field(ge=0)
    land_area_ping: float | None = Field(ge=0)
    building_age: float | None = Field(ge=0)
    floor: str | None
    rooms: float | None = Field(ge=0)
    bathrooms: float | None = Field(ge=0)
    parking: str | None
    auction_type: str | None
    auction_round: int | None = Field(ge=1)
    auction_date: date | None
    reserve_price: float | None = Field(ge=0)
    final_price: float | None = None
    deposit: float | None = Field(ge=0)
    case_number: str | None
    ownership_share: str | None
    handover_status: str | None
    listing_status: Literal["upcoming", "ended", "suspended", "unknown"]
    first_seen_at: datetime
    last_seen_at: datetime
    last_verified_at: datetime
    source_updated_at: date | datetime | None
    data_quality_score: float = Field(ge=0, le=1)
    duplicate_group_id: str | None = None
    duplicate_confidence: float | None = Field(default=None, ge=0, le=1)
    duplicate_match_basis: list[str] = Field(default_factory=list)
    source_details: dict[str, str | None] = Field(default_factory=dict)

    @model_validator(mode="after")
    def validate_location(self) -> "Property":
        has_latitude = self.latitude is not None
        has_longitude = self.longitude is not None
        if has_latitude != has_longitude:
            raise ValueError("latitude and longitude must be provided together")
        if self.location_precision == "none" and (has_latitude or has_longitude):
            raise ValueError("location_precision cannot be none when coordinates exist")
        if self.location_precision != "none" and not (has_latitude and has_longitude):
            raise ValueError("coordinates are required when location_precision is not none")
        return self
