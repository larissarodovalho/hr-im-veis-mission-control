import { Link } from "react-router-dom";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { ETAPAS, EtapaFunil, categoriaDe, CATEGORIA_LABEL, qualificacaoInfo } from "@/lib/contasFunil";
import { Handshake, Target, User, MoreVertical, Check, UserX, Thermometer, PencilLine, ArrowLeftRight, Megaphone, Clock, HandCoins, ExternalLink, CalendarClock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { dayKeyCRM, fmtDateTime, todayCRM } from "@/lib/datetime";
import { tempInfo, TEMPERATURAS } from "@/lib/contasTemperatura";
import { estagioLabel } from "@/lib/oportunidadesFunil";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Account = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  is_partner: boolean | null;
  interesse: string | null;
  etapa_funil: string | null;
  responsavel_id: string | null;
  created_by?: string | null;
  temperatura?: string | null;
  categoria?: string | null;
  tags?: string[] | null;
  origem?: string | null;
  qualificacao_status?: string | null;
  proxima_acao_em?: string | null;
};

type Property = { conta_id: string; valor_negocio: number | null };

export type OpAtivaResumo = {
  id: string;
  titulo: string;
  estagio: string;
  valor_alvo: number | null;
  corretor_id: string | null;
};

export type NextTaskResumo = { titulo: string; prazo: string; prioridade: string };

function nextTaskCountdown(prazo: string): { texto: string; tom: "futuro" | "hoje" | "atrasada" } | null {
  const hoje = todayCRM();
  const dia = dayKeyCRM(prazo);
  if (!dia) return null;
  const diff = Math.round((new Date(dia + "T12:00:00").getTime() - new Date(hoje + "T12:00:00").getTime()) / 86400000);
  if (diff < 0) return { texto: `atrasada há ${-diff} dia${-diff > 1 ? "s" : ""}`, tom: "atrasada" };
  if (diff === 0) return { texto: "contatar hoje", tom: "hoje" };
  if (diff === 1) return { texto: "contatar amanhã", tom: "hoje" };
  return { texto: `em ${diff} dias`, tom: "futuro" };
}

interface Props {
  accounts: Account[];
  propsByAccount: Record<string, Property[]>;
  onMoveStage: (contaId: string, etapa: EtapaFunil) => void;
  onChangeOwner?: (contaId: string, userId: string | null) => void;
  onChangeTemperatura?: (contaId: string, temp: string | null) => void;
  onChangeCategoria?: (contaId: string) => void;
  onQualificar?: (contaId: string) => void;
  opAtivaPorConta?: Record<string, OpAtivaResumo>;
  lista?: "carteira" | "marketing";
  lastContactMap?: Record<string, string>;
  nextTaskMap?: Record<string, NextTaskResumo>;
  ownerMap?: Record<string, string>;
  owners?: { id: string; nome: string }[];
}

import { formatBRL } from "@/lib/format";
const fmt = (v: number) => (v ? formatBRL(v) : "—");

const OWNER_PALETTE = [
  "bg-indigo-500/15 text-indigo-700 border-indigo-500/30",
  "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  "bg-rose-500/15 text-rose-700 border-rose-500/30",
  "bg-amber-500/15 text-amber-700 border-amber-500/30",
  "bg-sky-500/15 text-sky-700 border-sky-500/30",
  "bg-violet-500/15 text-violet-700 border-violet-500/30",
  "bg-teal-500/15 text-teal-700 border-teal-500/30",
  "bg-fuchsia-500/15 text-fuchsia-700 border-fuchsia-500/30",
  "bg-lime-600/15 text-lime-700 border-lime-600/30",
  "bg-orange-500/15 text-orange-700 border-orange-500/30",
];

function ownerColor(id?: string | null) {
  if (!id) return OWNER_PALETTE[0];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return OWNER_PALETTE[h % OWNER_PALETTE.length];
}

function shortName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function ContaCard({
  a,
  total,
  responsavelNome,
  criadorNome,
  owners,
  onMoveStage,
  onChangeOwner,
  onChangeTemperatura,
  onChangeCategoria,
  onQualificar,
  opAtiva,
  ownerMap,
  lista,
  lastContact,
  nextTask,
}: {
...
  opAtiva?: OpAtivaResumo;
  ownerMap?: Record<string, string>;
  lista?: "carteira" | "marketing";
  lastContact?: string | null;
  nextTask?: NextTaskResumo | null;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: a.id });
  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();
  const currentEtapa = (a.etapa_funil ?? "a_contatar") as EtapaFunil;
  const categoria = categoriaDe(a);
  const outraLista = lista && categoria && categoria !== lista ? CATEGORIA_LABEL[categoria] : null;
  const emContatoEstabelecido = currentEtapa === "contato_estabelecido";
  const qInfo = emContatoEstabelecido ? qualificacaoInfo(a.qualificacao_status) : null;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors space-y-1.5 touch-none"
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          to={`/crm/contas/${a.id}`}
          onClick={stop}
          onPointerDown={stop}
          className="font-medium text-sm hover:underline truncate flex-1"
        >
          {a.nome}
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          {a.is_partner && (
            <Badge className="bg-accent/20 text-accent-foreground border-accent/40 border text-[10px]">
              <Handshake className="h-3 w-3 mr-1" /> Parceiro
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onPointerDown={stop}
                onClick={stop}
                aria-label="Ações"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" onPointerDown={stop} onClick={stop}>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Mover para etapa</DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="max-h-72 overflow-y-auto">
                    {ETAPAS.map((et) => (
                      <DropdownMenuItem
                        key={et.id}
                        onSelect={() => onMoveStage(a.id, et.id)}
                      >
                        {et.id === currentEtapa ? (
                          <Check className="h-3.5 w-3.5 mr-2" />
                        ) : (
                          <span className="w-3.5 mr-2" />
                        )}
                        {et.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              {onChangeCategoria && (
                <DropdownMenuItem onSelect={() => onChangeCategoria(a.id)}>
                  <ArrowLeftRight className="h-3.5 w-3.5 mr-2" />
                  Alterar categoria
                </DropdownMenuItem>
              )}

              {emContatoEstabelecido && onQualificar && (
                <DropdownMenuItem onSelect={() => onQualificar(a.id)}>
                  <HandCoins className="h-3.5 w-3.5 mr-2" />
                  Qualificar e gerar oportunidade
                </DropdownMenuItem>
              )}

              {onChangeOwner && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Responsável</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="max-h-72 overflow-y-auto w-56">
                      <DropdownMenuLabel className="text-xs text-muted-foreground">
                        Atribuir a
                      </DropdownMenuLabel>
                      <DropdownMenuItem onSelect={() => onChangeOwner(a.id, null)}>
                        <UserX className="h-3.5 w-3.5 mr-2" />
                        Sem responsável
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {(owners ?? []).map((o) => (
                        <DropdownMenuItem
                          key={o.id}
                          onSelect={() => onChangeOwner(a.id, o.id)}
                        >
                          {o.id === a.responsavel_id ? (
                            <Check className="h-3.5 w-3.5 mr-2" />
                          ) : (
                            <span className="w-3.5 mr-2" />
                          )}
                          {o.nome}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              )}

              {onChangeTemperatura && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Temperatura</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent className="w-48">
                      <DropdownMenuItem onSelect={() => onChangeTemperatura(a.id, null)}>
                        {!a.temperatura ? (
                          <Check className="h-3.5 w-3.5 mr-2" />
                        ) : (
                          <Thermometer className="h-3.5 w-3.5 mr-2" />
                        )}
                        Sem temperatura
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {TEMPERATURAS.map((t) => (
                        <DropdownMenuItem
                          key={t.id}
                          onSelect={() => onChangeTemperatura(a.id, t.id)}
                        >
                          {a.temperatura === t.id ? (
                            <Check className="h-3.5 w-3.5 mr-2" />
                          ) : (
                            <span className="w-3.5 mr-2" />
                          )}
                          {t.emoji} {t.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="text-xs text-muted-foreground truncate">{a.telefone || a.email || "—"}</div>
      {lastContact && (
        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3 shrink-0" />
          Últ. contato: {format(new Date(lastContact), "dd/MM/yyyy", { locale: ptBR })}
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {outraLista ? (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px]">
            {outraLista}
          </Badge>
        ) : categoria === "marketing" ? (
          <Badge variant="outline" className="bg-fuchsia-500/15 text-fuchsia-700 border-fuchsia-500/30 text-[10px]">
            <Megaphone className="h-3 w-3 mr-1" /> Marketing
          </Badge>
        ) : null}
        {lista === "carteira" && a.origem && (
          <Badge variant="outline" className="text-[10px] text-muted-foreground" title="Origem da conta">
            {a.origem}
          </Badge>
        )}
        {(() => {
          const t = tempInfo(a.temperatura);
          return t ? (
            <Badge variant="outline" className={`${t.badge} text-[10px]`}>{t.emoji} {t.label}</Badge>
          ) : null;
        })()}
        {a.interesse && (
          <Badge variant="outline" className="bg-amber-500/15 text-amber-700 border-amber-500/30 text-[10px]">
            <Target className="h-3 w-3 mr-1" /> {a.interesse}
          </Badge>
        )}
        {responsavelNome && (
          <Badge variant="outline" className={`${ownerColor(a.responsavel_id)} text-[10px]`}>
            <User className="h-3 w-3 mr-1" /> {shortName(responsavelNome)}
          </Badge>
        )}
        {criadorNome && a.created_by && a.created_by !== a.responsavel_id && (
          <Badge variant="outline" className="text-[10px] text-muted-foreground" title={`Criado por ${criadorNome}`}>
            <PencilLine className="h-3 w-3 mr-1" /> {shortName(criadorNome)}
          </Badge>
        )}
      </div>

      {emContatoEstabelecido && (
        <div className="rounded-md border border-dashed p-2 space-y-1.5 bg-muted/20">
          {opAtiva ? (
            <>
              <div className="flex items-center justify-between gap-1">
                <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px]">
                  <HandCoins className="h-3 w-3 mr-1" /> Oportunidade ativa
                </Badge>
                <Link
                  to={`/crm/oportunidades?op=${opAtiva.id}`}
                  onClick={stop}
                  onPointerDown={stop}
                  className="text-[10px] text-primary hover:underline flex items-center gap-0.5 shrink-0"
                >
                  Abrir <ExternalLink className="h-2.5 w-2.5" />
                </Link>
              </div>
              <p className="text-[11px] leading-tight line-clamp-2">{opAtiva.titulo}</p>
              <p className="text-[10px] text-muted-foreground">
                {estagioLabel(opAtiva.estagio)}
                {opAtiva.valor_alvo ? ` · ${fmt(opAtiva.valor_alvo)}` : ""}
                {opAtiva.corretor_id && ownerMap?.[opAtiva.corretor_id] ? ` · ${shortName(ownerMap[opAtiva.corretor_id])}` : ""}
              </p>
            </>
          ) : qInfo ? (
            <div className="flex items-center justify-between gap-1">
              <Badge variant="outline" className={`${qInfo.badge} text-[10px]`}>
                <HandCoins className="h-3 w-3 mr-1" /> {qInfo.label}
              </Badge>
              {qInfo.status === "pendente" && onQualificar && (
                <button
                  onPointerDown={stop}
                  onClick={(e) => { stop(e); onQualificar(a.id); }}
                  className="text-[10px] text-primary hover:underline shrink-0"
                >
                  Continuar
                </button>
              )}
            </div>
          ) : null}
          {qInfo?.status === "oportunidade_futura" && a.proxima_acao_em && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />
              Próxima ação: {format(new Date(a.proxima_acao_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </p>
          )}
        </div>
      )}

      {total > 0 && <div className="text-xs font-medium">{fmt(total)}</div>}
    </Card>
  );
}

function Column({
  etapa,
  label,
  color,
  children,
  count,
}: {
  etapa: EtapaFunil;
  label: string;
  color: string;
  children: React.ReactNode;
  count: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa });
  return (
    <div className="flex-1 min-w-[260px] min-h-0 flex flex-col">
      <div className={`px-3 py-2 rounded-t-md border ${color} flex items-center justify-between shrink-0`}>
        <span className="text-sm font-semibold">{label}</span>
        <Badge variant="outline" className="text-[10px]">{count}</Badge>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-0 p-2 space-y-2 bg-muted/20 border border-t-0 rounded-b-md overflow-y-auto transition-colors ${
          isOver ? "bg-primary/5 border-primary/40" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export default function ContasKanban({ accounts, propsByAccount, onMoveStage, onChangeOwner, onChangeTemperatura, onChangeCategoria, onQualificar, opAtivaPorConta, lista, lastContactMap, ownerMap, owners }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onDragEnd = (e: DragEndEvent) => {
    const id = String(e.active.id);
    const over = e.over?.id;
    if (!over) return;
    const novaEtapa = String(over) as EtapaFunil;
    const conta = accounts.find((a) => a.id === id);
    if (!conta || conta.etapa_funil === novaEtapa) return;
    onMoveStage(id, novaEtapa);
  };

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-2 h-full min-h-0">


        {ETAPAS.map((et) => {
          const cards = accounts.filter((a) => (a.etapa_funil ?? "a_contatar") === et.id);
          return (
            <Column key={et.id} etapa={et.id} label={et.label} color={et.color} count={cards.length}>
              {cards.map((a) => {
                const total = (propsByAccount[a.id] ?? []).reduce((s, p) => s + (p.valor_negocio ?? 0), 0);
                const responsavelNome = a.responsavel_id ? ownerMap?.[a.responsavel_id] : null;
                const criadorNome = a.created_by ? ownerMap?.[a.created_by] : null;
                return (
                  <ContaCard
                    key={a.id}
                    a={a}
                    total={total}
                    responsavelNome={responsavelNome}
                    criadorNome={criadorNome}
                    owners={owners}
                    onMoveStage={onMoveStage}
                    onChangeOwner={onChangeOwner}
                    onChangeTemperatura={onChangeTemperatura}
                    onChangeCategoria={onChangeCategoria}
                    onQualificar={onQualificar}
                    opAtiva={opAtivaPorConta?.[a.id]}
                    ownerMap={ownerMap}
                    lista={lista}
                    lastContact={lastContactMap?.[a.id]}
                  />
                );
              })}
              {cards.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-6">Vazio</div>
              )}
            </Column>
          );
        })}
      </div>
    </DndContext>
  );
}
