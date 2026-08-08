"use client";

import { Menu } from "@base-ui/react/menu";
import { DotsThreeVertical } from "@phosphor-icons/react";
import clsx from "clsx";

export type MenuAction = { label: string; onClick: () => void; tone?: "danger" };

export function ActionsMenu({ actions }: { actions: MenuAction[] }) {
  return (
    <Menu.Root>
      <Menu.Trigger aria-label="More actions" className="button-base button-quiet task-menu-trigger">
        <DotsThreeVertical aria-hidden size={18} weight="bold" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner align="end" className="task-menu-positioner" side="bottom" sideOffset={6}>
          <Menu.Popup className="task-menu-panel">
            {actions.map((action) => (
              <Menu.Item
                className={clsx("task-menu-item", action.tone === "danger" && "task-menu-item--danger")}
                key={action.label}
                onClick={action.onClick}
              >
                {action.label}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
