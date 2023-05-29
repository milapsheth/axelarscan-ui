import { useState, useEffect } from 'react'
import { useSelector, shallowEqual } from 'react-redux'
import _ from 'lodash'

import Spinner from '../spinner'
import { getChainData } from '../../lib/config'
import { toArray, numberFormat, equalsIgnoreCase } from '../../lib/utils'

const AXELAR = 'axelarnet'

export default ({ id = 'network', data }) => {
  const {
    preferences,
    chains,
  } = useSelector(
    state => (
      {
        preferences: state.preferences,
        chains: state.chains,
      }
    ),
    shallowEqual,
  )
  const {
    theme,
  } = { ...preferences }
  const {
    chains_data,
  } = { ...chains }

  const [rendered, setRendered] = useState(null)
  const [graph, setGraph] = useState(null)

  useEffect(
    () => {
      import('@antv/g6').then(G6 => {
        if (rendered && !graph) {
          setGraph(
            new G6.Graph({
              container: id,
              width: 693.33,
              height: 520,
              fitView: true,
              fitCenter: true,
              layout: { type: 'concentric', preventOverlap: true, clockwise: false },
              defaultNode: { size: 64 },
              defaultEdge: { labelCfg: { autoRotate: true } },
              modes: { default: ['drag-canvas', 'drag-node'] },
            })
          )
        }
        else if (!rendered) {
          setRendered(true)
        }
      })
    },
    [rendered],
  )

  useEffect(
    () => {
      if (data && chains_data && graph) {
        let _data = _.orderBy(
          Object.entries(
            _.groupBy(
              data.flatMap(d => {
                const {
                  source_chain,
                  destination_chain,
                } = { ...d }

                if (![source_chain, destination_chain].includes(AXELAR)) {
                  return [[source_chain, AXELAR], [AXELAR, destination_chain]].map((ids, i) => { return { ...d, id: ids.join('_'), [i === 0 ? 'destination_chain' : 'source_chain']: AXELAR } })
                }
                return d
              }),
              'id',
            )
          )
          .map(([k, v]) => {
            return {
              id: k,
              ..._.head(v),
              num_txs: _.sumBy(v, 'num_txs'),
              volume: _.sumBy(v, 'volume'),
            }
          }),
          ['num_txs'], ['desc'],
        )
        chains_data.filter(c => (!c.maintainer_id || !c.no_inflation) && c.id !== AXELAR).forEach(c => {
          [[c.id, AXELAR], [AXELAR, c.id]].map(ids => ids.join('_')).forEach((_id, i) => {
            if (_data.findIndex(d => equalsIgnoreCase(d.id, _id)) < 0) {
              _data.push({
                id: _id,
                source_chain: i === 0 ? c.id : AXELAR,
                destination_chain: i === 0 ? AXELAR : c.id,
                num_txs: 0,
              })
            }
          })
        })

        const nodes = []
        let edges = []
        const labelCfg = {
          style: {
            fontFamily: '"Lexend Deca", sans-serif',
            fontSize: 18,
            fontWeight: 500,
            fill: theme === 'dark' ? '#fff' : '#000',
          },
        }

        toArray(_data).forEach(d => {
          ['source', 'destination'].forEach(s => {
            const id = d[`${s}_chain`]
            if (id && nodes.findIndex(n => equalsIgnoreCase(n.id, id)) < 0) {
              const {
                name,
                image,
              } = { ...getChainData(id, chains_data) }

              const size = id === AXELAR ? 80 : 64
              nodes.push({
                id,
                size,
                type: 'image',
                img: image,
                label: name,
                labelCfg,
                clipCfg: { show: true, type: 'circle', r: size / 2 },
              })
            }
          })

          const {
            id,
            source_chain,
            destination_chain,
            num_txs,
          } = { ...d }

          edges.push({
            data: d,
            id,
            source: source_chain,
            target: destination_chain,
            type: 'circle-running',
            label: `${numberFormat(num_txs, '0,0')}`,
            labelCfg: { style: { ...labelCfg.style, fontSize: 14, textBaseline: 'bottom' } },
            curveOffset: 36,
            style: { stroke: theme === 'dark' ? '#333' : '#ddd' },
          })
        })

        import('@antv/g6').then(G6 => {
          G6.registerEdge(
            'circle-running',
            {
              afterDraw(cfg, group) {
                const shape = _.head(group.get('children'))
                const { x, y } = { ...shape.getPoint(0) }
                const { color } = { ...getChainData(cfg?.data?.source_chain, chains_data) }
                const circle = group.addShape('circle', { attrs: { x, y, fill: color, r: 3.5 }, name: 'circle-shape' })
                circle.animate(
                  ratio => {
                    const { x, y } = { ...shape.getPoint(ratio) }
                    return { x, y }
                  },
                  { repeat: true, duration: 3000 },
                )
              },
            },
            'quadratic',
          )
          graph.data({ nodes, edges })
          graph.render()
        })
      }
    },
    [data, theme, chains_data, graph],
  )

  return (
    <div>
      <div id={id} className={`${toArray(data).length > 0 ? 'flex items-center justify-center' : 'hidden'}`} />
      {!data && (
        <div className="loading-in-network-graph">
          <Spinner name="Blocks" />
        </div>
      )}
    </div>
  )
}