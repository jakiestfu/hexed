import type { FunctionComponent } from "react";
import type { KsySchema } from "@hexed/binary-templates";
import { Kbd } from "@hexed/ui";

export type ObjectTreeProps = {
  parsedData: Record<string, unknown> | null;
  spec: KsySchema | null;
};

const underscoreCaseToCamelCase = (str: string) => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

export const ObjectTree: FunctionComponent<ObjectTreeProps> = ({
  parsedData,
  spec,
}) => {
  console.log(parsedData, spec);
  return (
    <div>
      <ul>
        {spec?.seq?.map((item) => (
          <li key={item.id}>
            {underscoreCaseToCamelCase(String(item.id))}
            {item.contents ? (
              <span>
                : <Kbd>{JSON.stringify(item.contents, null, 2)}</Kbd>
              </span>
            ) : null}
            {/* {typeof item.type === "string" ? (
              <span>
                : <Kbd>{item.type}</Kbd>
              </span>
            ) : null} */}
          </li>
        ))}
      </ul>
    </div>
  );
};
