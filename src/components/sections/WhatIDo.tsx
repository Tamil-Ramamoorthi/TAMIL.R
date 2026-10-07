import { services } from "../../data";
import { Icon } from "../common/Icon";
import { SectionShell } from "../common/SectionShell";

/**
 * WHAT I DO
 * Dashed-border panels with bracket corner marks. Every capability listed is
 * backed by a technology in src/data/skills.ts — nothing aspirational.
 */
export function WhatIDo() {
  return (
    <SectionShell
      id="what-i-do"
      ghost="Build"
      lede={
        <p>
          Five areas, one through-line: take a model from raw data to something
          a person can actually use.
        </p>
      }
    >
      <div className="doing">
        {services.map((service) => (
          <article
            className="doing__item panel panel--dashed u-reveal"
            key={service.id}
          >
            <span className="corners" aria-hidden="true" />

            <div className="doing__top">
              <span className="doing__num">{service.index}</span>
              <Icon name={service.icon} className="doing__icon" />
            </div>

            <h3 className="t-h4">{service.title}</h3>
            <p className="doing__desc">{service.description}</p>

            <ul className="doing__details">
              {service.details.map((detail) => (
                <li className="doing__detail" key={detail}>
                  {detail}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
