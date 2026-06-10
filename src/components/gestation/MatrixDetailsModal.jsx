import {
  Baby,
  Camera,
  ClipboardList,
  History,
  Images,
  NotebookText,
  Pill,
  Scale,
  ShieldCheck,
  Stethoscope,
  Syringe,
} from 'lucide-react'
import Modal from '../Modal.jsx'
import { formatDate } from '../../utils/dateUtils.js'
import GestationStatusChip from './GestationStatusChip.jsx'
import GestationTimeline from './GestationTimeline.jsx'

function EvidencePlaceholder({ label, icon: Icon = Camera }) {
  return (
    <div className="flex min-h-28 flex-col items-center justify-center border border-dashed border-[#c8c1b1] bg-white p-3 text-center text-slate-500">
      <span className="grid h-9 w-9 place-items-center border border-[#d8d3c7] bg-[#f7f5ef] text-[#0b3b27]">
        <Icon size={18} />
      </span>
      <strong className="mt-2 text-xs text-slate-700">{label}</strong>
      <span className="mt-1 text-[10px]">Espaço para evidência</span>
    </div>
  )
}

export default function MatrixDetailsModal({
  item,
  boarName,
  coverages,
  births,
  lots,
  sanitary,
  onClose,
  onRegister,
}) {
  if (!item) return null

  const { matrix, coverage, elapsed, remaining, progress, stage, expectedDate } = item
  const matrixCoverages = coverages.filter((record) => record.matrixId === matrix.id)
  const matrixBirths = births.filter((record) => record.matrixId === matrix.id)
  const matrixLots = lots.filter((record) => record.matrixId === matrix.id)
  const matrixSanitary = sanitary.filter(
    (record) =>
      record.related === matrix.id || matrixLots.some((lot) => lot.id === record.related),
  )

  return (
    <Modal
      open
      onClose={onClose}
      title={`${matrix.id} · ${matrix.name}`}
      subtitle="Ficha completa de acompanhamento gestacional"
      size="max-w-5xl"
    >
      <div className="space-y-5">
        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="overflow-hidden rounded-2xl border border-[#d8d3c7] bg-white">
            <img
              src={matrix.image || '/images/aurora.jpg'}
              alt={`Matriz ${matrix.name}`}
              width="960"
              height="720"
              loading="lazy"
              decoding="async"
              className="h-40 w-full object-cover"
            />
            <div className="p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#ad7b22]">Informações da matriz</p>
                <h3 className="mt-1 text-xl font-bold text-[#082f1f]">{matrix.name}</h3>
                <p className="text-sm text-slate-500">{matrix.breed} · {matrix.weight} kg</p>
              </div>
              <GestationStatusChip status={stage} />
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <div><span className="text-slate-400">Cobertura</span><strong className="mt-1 block">{formatDate(coverage.date)}</strong></div>
                <div><span className="text-slate-400">Parto previsto</span><strong className="mt-1 block">{formatDate(expectedDate)}</strong></div>
                <div><span className="text-slate-400">VARRÃO</span><strong className="mt-1 block">{boarName(coverage.boarId)}</strong></div>
                <div><span className="text-slate-400">Responsável</span><strong className="mt-1 block">{coverage.responsible}</strong></div>
              </div>
            </div>
          </article>

          <article className={`border p-4 sm:p-5 ${remaining <= 7 ? 'border-red-200 bg-red-50' : 'border-[#d8c79e] bg-[#f8f2e5]'}`}>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Situação gestacional</p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <strong className="text-3xl font-bold text-[#082f1f]">{elapsed}/114</strong>
                <span className="ml-1 text-xs text-slate-500">dias</span>
              </div>
              <strong className={remaining <= 7 ? 'text-red-700' : 'text-[#946719]'}>
                {remaining < 0 ? `${Math.abs(remaining)} dias de atraso` : `${remaining} dias restantes`}
              </strong>
            </div>
            <div className="mt-4 h-2 overflow-hidden bg-white/80">
              <div
                className={`h-full ${remaining <= 7 ? 'bg-red-600' : 'bg-[#1b6a41]'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-right text-xs font-bold text-slate-600">{progress}% do ciclo</p>
          </article>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <ClipboardList size={18} className="text-[#0b3b27]" />
            <h3 className="section-title">Linha do tempo da gestação</h3>
          </div>
          <GestationTimeline coverage={coverage} elapsed={elapsed} remaining={remaining} />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="border border-[#d8d3c7] bg-white p-4 sm:p-5">
            <div className="flex items-center gap-2 border-b border-[#e7e2d8] pb-3">
              <History size={18} className="text-[#0b3b27]" />
              <h3 className="font-bold text-[#082f1f]">Histórico reprodutivo</h3>
            </div>
            <div className="mt-3 space-y-3">
              {matrixCoverages.map((record) => (
                <div key={record.id} className="border-l-2 border-[#ad7b22] pl-3 text-xs">
                  <strong className="text-slate-800">Cobertura em {formatDate(record.date)}</strong>
                  <p className="mt-1 text-slate-500">Varrão {boarName(record.boarId)} · previsão {formatDate(record.expectedDate)}</p>
                </div>
              ))}
              {matrixBirths.map((birth) => (
                <div key={birth.id} className="grid grid-cols-[auto_1fr] gap-3 border-t border-[#eee9df] pt-3 text-xs">
                  <Stethoscope size={17} className="text-[#1b6a41]" />
                  <div>
                    <strong>Parto em {formatDate(birth.date)}</strong>
                    <p className="mt-1 text-slate-500">{birth.alive} vivos · {birth.stillborn} natimortos · {birth.mummified} mumificados</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="border border-[#d8d3c7] bg-white p-4 sm:p-5">
            <div className="flex items-center gap-2 border-b border-[#e7e2d8] pb-3">
              <ShieldCheck size={18} className="text-[#0b3b27]" />
              <h3 className="font-bold text-[#082f1f]">Vacinas e medicamentos</h3>
            </div>
            <div className="mt-3 space-y-3">
              {matrixSanitary.length ? matrixSanitary.map((record) => (
                <div key={record.id} className="flex gap-3 text-xs">
                  {record.type === 'Vacina'
                    ? <Syringe size={17} className="shrink-0 text-[#1b6a41]" />
                    : <Pill size={17} className="shrink-0 text-[#ad7b22]" />}
                  <div>
                    <strong className="text-slate-800">{record.product}</strong>
                    <p className="mt-1 text-slate-500">{formatDate(record.date)} · {record.dosage} · {record.responsible}</p>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-slate-500">Nenhum registro sanitário vinculado.</p>
              )}
            </div>
          </article>
        </section>

        <section className="border border-[#d8d3c7] bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Scale size={18} className="text-[#0b3b27]" />
            <h3 className="font-bold text-[#082f1f]">Pesos dos leitões</h3>
          </div>
          {matrixLots.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {matrixLots.map((lot) => (
                <div key={lot.id} className="border border-[#e2ddd2] bg-[#f7f5ef] p-3 text-xs">
                  <strong>{lot.id} · {formatDate(lot.birthDate)}</strong>
                  <div className="mt-3 grid grid-cols-5 gap-1 text-center">
                    {Object.entries(lot.weights).map(([phase, weight]) => (
                      <div key={phase} className="bg-white p-2">
                        <span className="block text-[9px] font-bold text-slate-400">{phase}</span>
                        <strong className="mt-1 block text-[10px]">{weight ? `${weight} kg` : '--'}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-500">Os pesos serão exibidos após o registro do parto e criação do lote.</p>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Images size={18} className="text-[#0b3b27]" />
            <h3 className="section-title">Fotos e evidências</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <EvidencePlaceholder label="Matriz" />
            <EvidencePlaceholder label="Baia maternidade" icon={NotebookText} />
            <EvidencePlaceholder label="Leitões" icon={Baby} />
            <EvidencePlaceholder label="Registro visual do parto" icon={Stethoscope} />
          </div>
        </section>

        <section className="border-l-4 border-l-[#ad7b22] bg-[#f8f2e5] p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#946719]">Observações</h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">{matrix.notes}</p>
          {coverage.notes && <p className="mt-2 text-sm leading-6 text-slate-600">{coverage.notes}</p>}
        </section>

        <div className="flex justify-end">
          <button className="primary-button w-full sm:w-auto" onClick={onRegister}>
            <Stethoscope size={17} />
            Registrar parto
          </button>
        </div>
      </div>
    </Modal>
  )
}
