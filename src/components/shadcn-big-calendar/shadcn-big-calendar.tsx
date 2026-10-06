import { useCallback } from "react";
import { Calendar, type SlotInfo } from "react-big-calendar";
import "./shadcn-big-calendar.css";

type ShadcnBigCalendarProps<TEvent extends object, TResource extends object> =
  React.ComponentProps<typeof Calendar<TEvent, TResource>>;

interface DayCellProps {
  value: Date;
  children: React.ReactNode;
}

/**
 * dateCellWrapper solo se usa en la vista mes (BackgroundCells). El div extra
 * es layout-idéntico al default (NoopWrapper) y transporta la fecha local en
 * ms (epoch) para que el contenedor pueda abrir el día con un tap táctil.
 */
function MonthDayCellWithDate({ value, children }: DayCellProps) {
  return <div data-rbc-date={value.getTime()}>{children}</div>;
}

const ShadcnBigCalendar = <TEvent extends object, TResource extends object>(
  props: ShadcnBigCalendarProps<TEvent, TResource>,
) => {
  const { components, selectable, onSelectSlot, ...rest } = props;

  const handleContainerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!selectable || !onSelectSlot) return;

      // Desktop (mouse) ya lo maneja el motor de selección de RCB; solo
      // intervenimos en toques táctiles (pointerType "touch"/"pen" o ausente).
      const native = e.nativeEvent as PointerEvent;
      if (native.pointerType && native.pointerType === "mouse") return;

      // El número del día (.rbc-button-link) abre vía onDrillDown; no duplicar.
      const target = e.target as Element;
      if (target.closest(".rbc-button-link")) return;

      // Solo en la vista mes.
      const monthView = target.closest<HTMLElement>(".rbc-month-view");
      if (!monthView) return;

      // 1) Tap directo sobre el fondo del día (dentro del wrapper data-rbc-date).
      let cell = target.closest<HTMLElement>("[data-rbc-date]");

      // 2) El espacio de la celda vive en .rbc-row-content (hermano del fondo,
      //    por encima en z-index): derivar la columna desde la X del click y
      //    buscar el fondo (data-rbc-date) de esa columna en la misma fila.
      if (!cell) {
        const row = target.closest<HTMLElement>(".rbc-month-row");
        if (!row) return;
        const rowBox = row.getBoundingClientRect();
        if (rowBox.width <= 0) return;
        const col = Math.floor((e.clientX - rowBox.left) / (rowBox.width / 7));
        const dayBg = row.querySelectorAll<HTMLElement>(".rbc-day-bg")[col];
        if (dayBg) cell = dayBg.closest<HTMLElement>("[data-rbc-date]");
      }
      if (!cell) return;

      const ts = Number(cell.getAttribute("data-rbc-date"));
      if (!Number.isInteger(ts)) return;

      const start = new Date(ts);
      const end = new Date(ts);
      end.setDate(end.getDate() + 1);
      onSelectSlot({ start, end, action: "click" } as SlotInfo);
    },
    [onSelectSlot, selectable],
  );

  return (
    <div onClick={handleContainerClick}>
      <Calendar
        {...rest}
        selectable={selectable}
        onSelectSlot={onSelectSlot}
        components={{ ...components, dateCellWrapper: MonthDayCellWithDate }}
      />
    </div>
  );
};

export default ShadcnBigCalendar;
